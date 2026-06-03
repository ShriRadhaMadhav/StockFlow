import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import { Product } from '../src/models/Product';
import { InventoryBatch } from '../src/models/InventoryBatch';
import { Customer } from '../src/models/Customer';
import { Vendor } from '../src/models/Vendor';
import { Invoice } from '../src/models/Invoice';
import { Payment } from '../src/models/Payment';
import { VendorPayment } from '../src/models/VendorPayment';

// Import services & handlers
import * as invoiceService from '../src/services/invoice.service';
import * as paymentService from '../src/services/payment.service';
import * as customerController from '../src/controllers/customer.controller';
import * as vendorController from '../src/controllers/vendor.controller';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function runLedgerQA() {
  console.log('🚀 Starting Customer & Vendor Ledger and Outstanding Balance QA Suite...\n');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const businessId = new mongoose.Types.ObjectId();
    const createdBy = new mongoose.Types.ObjectId();

    // -------------------------------------------------------------------------
    // 1. Setup Customer QA
    // -------------------------------------------------------------------------
    console.log('\n--- CUSTOMER BALANCES & LEDGER TIMELINE TESTS ---');
    const customer = await Customer.create({
      businessId,
      name: 'Ledger QA Customer',
      email: `ledger-cust-${Date.now()}@test.com`,
      outstandingBalance: 0,
    });

    const product = await Product.create({
      name: 'QA Printer paper',
      sku: 'QA-PR-LGR-' + Date.now(),
      category: 'Office Products',
      unit: 'pcs',
      sellingPrice: 150,
      lowStockThreshold: 5,
      businessId,
    });

    await InventoryBatch.create({
      businessId,
      productId: product._id,
      initialQuantity: 100,
      quantity: 100,
      purchasePrice: 40,
      addedDate: new Date(),
    });

    product.totalStock = 100;
    await product.save();

    console.log(`✅ Setup Completed: Customer: ${customer.name}`);

    // Create and Finalize an Invoice (Total: $1,500)
    const invoice = await invoiceService.createInvoiceTransactional({
      businessId: businessId.toString(),
      customerId: customer._id.toString(),
      items: [
        {
          productId: product._id.toString(),
          quantity: 10,
          sellingPrice: 150,
          subtotal: 1500,
        },
      ],
      subtotal: 1500,
      taxPercentage: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 1500,
      workflowState: 'finalized',
      dueDate: new Date().toISOString(),
      createdBy: createdBy.toString(),
    });

    console.log(`✅ Finalized Invoice Created. Invoice Total: $${invoice.total}.`);

    // Verify Customer Balance increases to $1,500
    let updatedCustomer = await Customer.findById(customer._id);
    if (updatedCustomer?.outstandingBalance !== 1500) {
      throw new Error(`Expected Customer Balance 1500, got ${updatedCustomer?.outstandingBalance}`);
    }
    console.log(`✅ Verified: Customer outstanding balance increased to $${updatedCustomer.outstandingBalance}`);

    // Record Payment ($500)
    await paymentService.recordPaymentTransactional({
      businessId: businessId.toString(),
      invoiceId: invoice._id.toString(),
      customerId: customer._id.toString(),
      amount: 500,
      paymentMethod: 'bank_transfer',
      referenceNumber: 'TXN-CUST-LGR-1',
      recordedBy: createdBy.toString(),
    });

    // Verify Customer Balance decreases strictly by $500 (Remaining: $1,000)
    updatedCustomer = await Customer.findById(customer._id);
    if (updatedCustomer?.outstandingBalance !== 1000) {
      throw new Error(`Expected Customer Balance 1000, got ${updatedCustomer?.outstandingBalance}`);
    }
    console.log(`✅ Verified: Customer outstanding balance reduced strictly by $500. Current: $${updatedCustomer.outstandingBalance}`);

    // Verify consolidated Ledger timeline calculation
    // Mock req and res for getCustomerLedger controller method
    const mockReq = {
      params: { id: customer._id.toString() },
      user: { businessId: businessId.toString() },
    } as any;

    let resData: any = null;
    const mockRes = {
      status: (code: number) => {
        return {
          json: (data: any) => {
            resData = data;
          }
        };
      }
    } as any;

    await customerController.getCustomerLedger(mockReq, mockRes);
    
    if (!resData || !resData.success) {
      throw new Error('Failed to retrieve customer ledger timeline');
    }

    const customerLedger = resData.data;
    if (customerLedger.length !== 2) {
      throw new Error(`Expected 2 ledger entries, got ${customerLedger.length}`);
    }

    // Newest items first:
    // First entry: payment (-$500, runningBalance: $1000)
    // Second entry: invoice (+$1500, runningBalance: $1500)
    if (customerLedger[0].type !== 'payment' || customerLedger[0].runningBalance !== 1000) {
      throw new Error('Consolidated customer ledger timeline calculations failed on payments.');
    }
    if (customerLedger[1].type !== 'invoice' || customerLedger[1].runningBalance !== 1500) {
      throw new Error('Consolidated customer ledger timeline calculations failed on invoices.');
    }
    console.log('✅ Verified: Customer consolidated timeline ledger and running balance math are absolutely correct!');

    // -------------------------------------------------------------------------
    // 2. Setup Vendor QA
    // -------------------------------------------------------------------------
    console.log('\n--- VENDOR BALANCES & LEDGER TIMELINE TESTS ---');
    const vendor = await Vendor.create({
      businessId,
      name: 'Ledger QA Vendor',
      email: `ledger-vend-${Date.now()}@test.com`,
      outstandingBalance: 0,
    });

    console.log(`✅ Setup Completed: Vendor: ${vendor.name}`);

    // Create an Inventory Batch linked to the Vendor (50 units * $30 = $1500)
    // Mock req and res for createBatch controller
    const mockBatchReq = {
      body: {
        productId: product._id.toString(),
        vendorId: vendor._id.toString(),
        quantity: 50,
        purchasePrice: 30,
        invoiceNumber: 'INV-VEND-LGR-1',
      },
      user: { 
        businessId: businessId.toString(),
        userId: createdBy.toString(),
      },
    } as any;

    let batchResData: any = null;
    const mockBatchRes = {
      status: (code: number) => {
        return {
          json: (data: any) => {
            batchResData = data;
          }
        };
      }
    } as any;

    // We can call createBatch directly
    const { createBatch } = require('../src/controllers/inventory.controller');
    await createBatch(mockBatchReq, mockBatchRes);

    if (!batchResData || !batchResData.success) {
      throw new Error(`Failed to create inventory batch: ${batchResData?.message}`);
    }

    const createdBatch = batchResData.data;
    console.log(`✅ Inventory batch generated. Procured Total: $${createdBatch.initialQuantity * createdBatch.purchasePrice}`);

    // Check Vendor outstanding balance increased atomically by quantity * purchasePrice ($1,500)
    let updatedVendor = await Vendor.findById(vendor._id);
    if (updatedVendor?.outstandingBalance !== 1500) {
      throw new Error(`Expected Vendor balance 1500, got ${updatedVendor?.outstandingBalance}`);
    }
    console.log(`✅ Verified: Vendor accounts payable balance increased atomically to $${updatedVendor.outstandingBalance}`);

    // Settle vendor outstanding balance via recordVendorPayment controller method ($1,000 payment)
    const mockPayReq = {
      params: { id: vendor._id.toString() },
      body: {
        amount: 1000,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'TXN-VEND-LGR-PAY-1',
      },
      user: {
        businessId: businessId.toString(),
        userId: createdBy.toString(),
      }
    } as any;

    let payResData: any = null;
    const mockPayRes = {
      status: (code: number) => {
        return {
          json: (data: any) => {
            payResData = data;
          }
        };
      }
    } as any;

    await vendorController.recordVendorPayment(mockPayReq, mockPayRes);

    if (!payResData || !payResData.success) {
      throw new Error(`Failed to record vendor payment: ${payResData?.message}`);
    }

    console.log(`✅ Vendor Payment recorded. Settle Amount: $${payResData.data.amount}`);

    // Check outstanding balance decreases correctly to $500
    updatedVendor = await Vendor.findById(vendor._id);
    if (updatedVendor?.outstandingBalance !== 500) {
      throw new Error(`Expected Vendor payable balance to be 500, got ${updatedVendor?.outstandingBalance}`);
    }
    console.log(`✅ Verified: Vendor outstanding payable balance reduced strictly to $${updatedVendor.outstandingBalance}`);

    // Check Vendor Ledger Timeline
    const mockLedgerReq = {
      params: { id: vendor._id.toString() },
      user: { businessId: businessId.toString() },
    } as any;

    let ledgerResData: any = null;
    const mockLedgerRes = {
      status: (code: number) => {
        return {
          json: (data: any) => {
            ledgerResData = data;
          }
        };
      }
    } as any;

    await vendorController.getVendorLedger(mockLedgerReq, mockLedgerRes);

    if (!ledgerResData || !ledgerResData.success) {
      throw new Error(`Failed to retrieve vendor ledger: ${ledgerResData?.message}`);
    }

    const vendorLedger = ledgerResData.data;
    if (vendorLedger.length !== 2) {
      throw new Error(`Expected 2 vendor ledger records, got ${vendorLedger.length}`);
    }

    // Newest items first:
    // First entry: payment sent (-$1000, runningBalance: $500)
    // Second entry: stock procurement charge (+$1500, runningBalance: $1500)
    if (vendorLedger[0].type !== 'payment' || vendorLedger[0].runningBalance !== 500) {
      throw new Error('Consolidated vendor ledger timeline calculations failed on payments.');
    }
    if (vendorLedger[1].type !== 'purchase' || vendorLedger[1].runningBalance !== 1500) {
      throw new Error('Consolidated vendor ledger timeline calculations failed on procurement arrivals.');
    }
    console.log('✅ Verified: Vendor consolidated timeline ledger and running balance math are absolutely correct!');

    console.log('\n🎉 ALL CUSTOMER & VENDOR LEDGER QA TESTS PASSED EXCELLENTLY!');

    // 3. Cleanup test collections
    await Customer.deleteMany({ businessId });
    await Vendor.deleteMany({ businessId });
    await Product.deleteMany({ businessId });
    await InventoryBatch.deleteMany({ businessId });
    await Invoice.deleteMany({ businessId });
    await Payment.deleteMany({ businessId });
    await VendorPayment.deleteMany({ businessId });
    console.log('✅ QA Clean up complete.');

  } catch (err) {
    console.error('\n❌ QA TEST SUITE CRASHED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runLedgerQA();
