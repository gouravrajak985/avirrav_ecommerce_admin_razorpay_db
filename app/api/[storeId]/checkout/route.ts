import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import Razorpay from "razorpay";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const {
      productIds,
      amount,
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country
    } = await req.json();
    
    if (!productIds || productIds.length === 0) {
      console.error('Product ids are required');
      return new NextResponse("Product ids are required", { status: 400 });
    }

    // Get store details including Razorpay credentials
    const store = await prismadb.store.findFirst({
      where: {
        id: params.storeId
      }
    });

    if (!store || !store.razorpayKeyId || !store.razorpayKeySecret) {
      return new NextResponse("Store Razorpay credentials not found", { status: 400 });
    }

    // Check stock availability for all products
    const products = await prismadb.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    // Create a map of product quantities
    const productQuantityMap = productIds.reduce((acc: { [key: string]: number }, id: string) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    // Check if any product is out of stock
    for (const product of products) {
      const requestedQuantity = productQuantityMap[product.id] || 0;
      if (!product.sellWhenOutOfStock && product.stockQuantity < requestedQuantity) {
        return new NextResponse(`Product ${product.name} is out of stock`, { status: 400 });
      }
    }

    // Initialize Razorpay with store credentials
    const razorpay = new Razorpay({
      key_id: store.razorpayKeyId,
      key_secret: store.razorpayKeySecret
    });

    // Wrap customer creation/update in try-catch
    try {
      // Check if customer exists using findUnique with composite key
      let customer = await prismadb.customer.findUnique({
        where: {
          email: email || ''
        }
      });
      if (customer) {
        // Update existing customer
        customer = await prismadb.customer.update({
          where : {
              email: email || ''
          },
          data: {
            fullName,
            phone,
            shippingAddress: JSON.stringify({
              addressLine1,
              addressLine2,
              city,
              state,
              postalCode,
              country
            })
          }
        });
      } else {
        // Create new customer with upsert to handle race conditions
        customer = await prismadb.customer.upsert({
          where:{
              email: email || ''
          },
          update: {
            fullName,
            phone,
            shippingAddress: JSON.stringify({
              addressLine1,
              addressLine2,
              city,
              state,
              postalCode,
              country
            })
          },
          create: {
            storeId: params.storeId,
            fullName,
            email: email || '',
            phone,
            shippingAddress: JSON.stringify({
              addressLine1,
              addressLine2,
              city,
              state,
              postalCode,
              country
            })
          }
        });
      }

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: amount,
        currency: "INR",
        receipt: `order_${Date.now()}`,
      });

      // Create order and update stock quantities in a transaction
      const order = await prismadb.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            storeId: params.storeId,
            customerId: customer?.id,
            isPaid: false,
            phone,
            email: email || '',
            address: addressLine1,
            razorOrderId: razorpayOrder.id,
            orderItems: {
              create: productIds.map((productId: string) => ({
                product: {
                  connect: {
                    id: productId
                  }
                }
              }))
            },
          },
        });
        // Update stock quantities
        for (const product of products) {
          const quantityOrdered = productQuantityMap[product.id] || 0;
          if (!product.sellWhenOutOfStock) {
            await tx.product.update({
              where: { id: product.id },
              data: {
                stockQuantity: {
                  decrement: quantityOrdered
                }
              }
            });
          }
        }

        return newOrder;
      });

      return NextResponse.json(razorpayOrder, {
        headers: corsHeaders
      });

    } catch (customerError) {
      console.error('[CUSTOMER_ERROR]', customerError);
      return new NextResponse("Error processing customer data", { status: 500 });
    }

  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}