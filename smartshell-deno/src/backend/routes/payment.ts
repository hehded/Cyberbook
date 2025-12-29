/**
 * Payment Routes
 * Maps payment endpoints to controller methods
 */
import { PaymentController } from '../controllers/PaymentController.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface Route {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export default function paymentRoutes(controller: PaymentController): Route[] {
  return [
    {
      method: 'GET',
      path: '/api/payments',
      handler: controller.getUserPaymentStats.bind(controller)
    },
    {
      method: 'POST',
      path: '/api/payments',
      handler: controller.processPayment.bind(controller)
    },
    {
      method: 'POST',
      path: '/api/payments/:id/refund',
      handler: controller.refundPayment.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/payments/history',
      handler: controller.getPaymentHistory.bind(controller)
    }
  ];
}