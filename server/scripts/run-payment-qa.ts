import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import { Product } from '../src/models/Product';
import { InventoryBatch } from '../src/models/InventoryBatch';
import { Customer } from '../src/models/Customer';
import { Invoice } from '../src/models/Invoice';
import { Payment } from '../src/models/Payment';

// Import services
import * as invoiceService from '../src/services/invoice.service';
import * as paymentService from '../src/services/payment.service';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function runPaymentQA() {
  console.log('🚀 Starting Payments Module Transactional QA Suite...\n');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const businessId = new mongoose.Types.ObjectId();
    const createdBy = new mongoose.Types.ObjectId();

    // 1. Setup Mock Customer & Product
    const customer = await Customer.create({
      businessId,
      name: 'Payment QA Customer',
      email: `payment-qa-${Date.now()}@test.com`,
      outstandingBalance: 0,
    });

    const product = await Product.create({
      name: 'QA Paper Ream',
      sku: 'QA-PR-' + Date.now(),
      category: 'Paper',
      unit: 'pcs',
      sellingPrice: 100,
      lowStockThreshold: 10,
      businessId,
    });

    await InventoryBatch.create({
      businessId,
      productId: product._id,
      initialQuantity: 100,
      quantity: 100,
      purchasePrice: 50,
      addedDate: new Date(),
    });

    product.totalStock = 100;
    await product.save();

    console.log(`✅ Setup Completed: Product Stock: 100, Customer: ${customer.name}`);

    // 2. Create and Finalize an Invoice (Total: $1,000)
    const invoice = await invoiceService.createInvoiceTransactional({
      businessId: businessId.toString(),
      customerId: customer._id.toString(),
      items: [
        {
          productId: product._id.toString(),
          quantity: 10,
          sellingPrice: 100,
          subtotal: 1000,
        },
      ],
      subtotal: 1000,
      taxPercentage: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 1000,
      workflowState: 'finalized',
      dueDate: new Date().toISOString(),
      createdBy: createdBy.toString(),
    });

    console.log(`✅ Finalized Invoice Created. Invoice Total: $${invoice.total}. Current payment status: ${invoice.paymentStatus}`);

    // Check customer outstanding balance updated
    let updatedCustomer = await Customer.findById(customer._id);
    if (updatedCustomer?.outstandingBalance !== 1000) {
      throw new Error(`Customer balance not correctly initialized to $1000. Balance is: ${updatedCustomer?.outstandingBalance}`);
    }
    console.log(`✅ Verified: Customer outstanding balance increased to $${updatedCustomer.outstandingBalance}`);

    // -------------------------------------------------------------
    // Test Scenario 1: Record a Partial Payment
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 1: Record a Partial Payment ($400) ---');
    
    const partialPayment = await paymentService.recordPaymentTransactional({
      businessId: businessId.toString(),
      invoiceId: invoice._id.toString(),
      customerId: customer._id.toString(),
      amount: 400,
      paymentMethod: 'bank_transfer',
      referenceNumber: 'TXN-PARTIAL-123',
      recordedBy: createdBy.toString(),
    });

    console.log(`✅ Partial Payment Recorded: ID ${partialPayment._id}, Method: ${partialPayment.paymentMethod}`);

    // Verify Invoice Status
    let updatedInvoice = await Invoice.findById(invoice._id);
    if (updatedInvoice?.paymentStatus === 'partial') {
      console.log(`✅ Verified: Invoice paymentStatus updated to "partial".`);
    } else {
      throw new Error(`Expected "partial", got "${updatedInvoice?.paymentStatus}"`);
    }

    // Verify Customer Outstanding Balance
    updatedCustomer = await Customer.findById(customer._id);
    if (updatedCustomer?.outstandingBalance === 600) {
      console.log(`✅ Verified: Customer outstanding balance reduced strictly by $400. Current: $${updatedCustomer.outstandingBalance}`);
    } else {
      throw new Error(`Balance mismatch: Expected 600, got ${updatedCustomer?.outstandingBalance}`);
    }

    // -------------------------------------------------------------
    // Test Scenario 2: Overpayment Protection (Rollback Guard)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 2: Overpayment Protection (Rollback Guard) ---');
    console.log('Attempting to pay $700 when the remaining invoice balance is only $600...');

    try {
      await paymentService.recordPaymentTransactional({
        businessId: businessId.toString(),
        invoiceId: invoice._id.toString(),
        customerId: customer._id.toString(),
        amount: 700, // OVERPAYMENT ($600 is remaining)
        paymentMethod: 'cash',
        recordedBy: createdBy.toString(),
      });
      throw new Error('❌ FAILURE: Overpayment was allowed when it should have rolled back!');
    } catch (error: any) {
      console.log(`✅ Overpayment correctly blocked. Error message: "${error.message}"`);
    }

    // Verify zero data corruption on rollback
    updatedInvoice = await Invoice.findById(invoice._id);
    updatedCustomer = await Customer.findById(customer._id);
    const paymentCount = await Payment.countDocuments({ invoiceId: invoice._id });

    if (updatedInvoice?.paymentStatus === 'partial' && updatedCustomer?.outstandingBalance === 600 && paymentCount === 1) {
      console.log(`✅ Verified: Complete transaction rollback successful. No corruption in balance, invoice status, or payment logs.`);
    } else {
      throw new Error('Rollback failed: database state mutated during error!');
    }

    // -------------------------------------------------------------
    // Test Scenario 3: Full Settlement Payment ($600)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 3: Full Settlement Payment ($600) ---');
    
    const settlementPayment = await paymentService.recordPaymentTransactional({
      businessId: businessId.toString(),
      invoiceId: invoice._id.toString(),
      customerId: customer._id.toString(),
      amount: 600, // Completes the payment
      paymentMethod: 'cheque',
      referenceNumber: 'CHQ-FINAL-999',
      recordedBy: createdBy.toString(),
    });

    console.log(`✅ Settlement Payment Recorded: ID ${settlementPayment._id}`);

    // Verify Invoice Status
    updatedInvoice = await Invoice.findById(invoice._id);
    if (updatedInvoice?.paymentStatus === 'paid') {
      console.log(`✅ Verified: Invoice paymentStatus updated strictly to "paid".`);
    } else {
      throw new Error(`Expected "paid", got "${updatedInvoice?.paymentStatus}"`);
    }

    // Verify Customer Outstanding Balance
    updatedCustomer = await Customer.findById(customer._id);
    if (updatedCustomer?.outstandingBalance === 0) {
      console.log(`✅ Verified: Customer outstanding balance is now strictly $0.`);
    } else {
      throw new Error(`Expected 0 outstanding balance, got ${updatedCustomer?.outstandingBalance}`);
    }

    // -------------------------------------------------------------
    // Test Scenario 4: Payments on Draft Invoices Excluded
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 4: Exclude Draft Invoices ---');
    
    const draftInvoice = await invoiceService.createInvoiceTransactional({
      businessId: businessId.toString(),
      customerId: customer._id.toString(),
      items: [
        {
          productId: product._id.toString(),
          quantity: 2,
          sellingPrice: 100,
          subtotal: 200,
        },
      ],
      subtotal: 200,
      taxPercentage: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 200,
      workflowState: 'draft',
      dueDate: new Date().toISOString(),
      createdBy: createdBy.toString(),
    });

    try {
      await paymentService.recordPaymentTransactional({
        businessId: businessId.toString(),
        invoiceId: draftInvoice._id.toString(),
        customerId: customer._id.toString(),
        amount: 50,
        paymentMethod: 'cash',
        recordedBy: createdBy.toString(),
      });
      throw new Error('❌ FAILURE: Payment was allowed on a draft invoice!');
    } catch (error: any) {
      console.log(`✅ Payment correctly blocked on Draft state. Error message: "${error.message}"`);
    }

    console.log('\n🎉 ALL PAYMENTS TRANSACTIONAL QA TESTS PASSED EXCELLENTLY!');

  } catch (err) {
    console.error('\n❌ PAYMENTS QA TEST SUITE CRASHED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas.');
  }
}

runPaymentQA();
