const { getPrismaClient } = require('./prismaClient');

// Database Query Performance Optimizer
class QueryOptimizer {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Batch çok sayıda order'ı efficient şekilde getirir
   * N+1 problem'ini önler
   */
  async getOrdersWithRelationsBatch(companyId, options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      includeCustomer = true, 
      includeSteps = true,
      includeItems = true 
    } = options;

    const skip = (page - 1) * limit;

    // Single query ile tüm related data'yı getir
    const [orders, totalCount] = await this.prisma.$transaction([
      this.prisma.orders.findMany({
        where: { Company_id: BigInt(companyId) },
        include: {
          ...(includeCustomer && {
            customer: {
              select: { id: true, Name: true }
            }
          }),
          ...(includeItems && {
            orderItems: {
              include: {
                product: {
                  select: { id: true, name: true }
                }
              }
            }
          }),
          ...(includeSteps && {
            orderSteps: {
              include: {
                product: {
                  select: { id: true, name: true }
                },
                assignedUser: {
                  select: { id: true, Name: true }
                }
              },
              orderBy: [
                { Product_id: 'asc' },
                { step_number: 'asc' }
              ]
            }
          })
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.orders.count({
        where: { Company_id: BigInt(companyId) }
      })
    ]);

    return {
      orders: this.formatOrdersResponse(orders),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * User'ın job'larını efficient şekilde getirir
   */
  async getUserJobsOptimized(userId, companyId) {
    const jobs = await this.prisma.orderSteps.findMany({
      where: {
        assigned_user: BigInt(userId),
        order: {
          Company_id: BigInt(companyId),
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            priority: true,
            deadline: true,
            customer: {
              select: { id: true, Name: true }
            }
          }
        },
        product: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { order: { priority: 'desc' } },
        { order: { deadline: 'asc' } },
        { step_number: 'asc' }
      ]
    });

    return this.formatJobsResponse(jobs);
  }

  /**
   * Company statistics'i efficient şekilde hesaplar
   */
  async getCompanyStatsOptimized(companyId) {
    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      activeUsers,
      pendingOrders,
      completedOrders
    ] = await this.prisma.$transaction([
      this.prisma.orders.count({
        where: { Company_id: BigInt(companyId) }
      }),
      this.prisma.products.count({
        where: { Company_id: BigInt(companyId) }
      }),
      this.prisma.customers.count({
        where: { Company_Id: BigInt(companyId) }
      }),
      this.prisma.user.count({
        where: { 
          company_id: BigInt(companyId),
          is_active: true 
        }
      }),
      this.prisma.orders.count({
        where: { 
          Company_id: BigInt(companyId),
          status: 'PENDING'
        }
      }),
      this.prisma.orders.count({
        where: { 
          Company_id: BigInt(companyId),
          status: 'COMPLETED'
        }
      })
    ]);

    return {
      totalOrders,
      totalProducts,
      totalCustomers,
      activeUsers,
      pendingOrders,
      completedOrders
    };
  }

  /**
   * BigInt serialization helper
   */
  formatOrdersResponse(orders) {
    return orders.map(order => ({
      ...order,
      id: order.id.toString(),
      Customer_id: order.Customer_id?.toString(),
      Company_id: order.Company_id.toString(),
      customer: order.customer ? {
        ...order.customer,
        id: order.customer.id.toString()
      } : null,
      orderItems: order.orderItems?.map(item => ({
        ...item,
        id: item.id.toString(),
        Order_id: item.Order_id.toString(),
        Product_id: item.Product_id.toString(),
        product: {
          ...item.product,
          id: item.product.id.toString()
        }
      })) || [],
      orderSteps: order.orderSteps?.map(step => ({
        ...step,
        id: step.id.toString(),
        Order_id: step.Order_id.toString(),
        Product_id: step.Product_id.toString(),
        assigned_user: step.assigned_user?.toString(),
        product: {
          ...step.product,
          id: step.product.id.toString()
        },
        assignedUser: step.assignedUser ? {
          ...step.assignedUser,
          id: step.assignedUser.id.toString()
        } : null
      })) || []
    }));
  }

  formatJobsResponse(jobs) {
    return jobs.map(job => ({
      ...job,
      id: job.id.toString(),
      Order_id: job.Order_id.toString(),
      Product_id: job.Product_id.toString(),
      assigned_user: job.assigned_user?.toString(),
      order: {
        ...job.order,
        id: job.order.id.toString(),
        customer: job.order.customer ? {
          ...job.order.customer,
          id: job.order.customer.id.toString()
        } : null
      },
      product: {
        ...job.product,
        id: job.product.id.toString()
      }
    }));
  }
}

// Singleton instance
const queryOptimizer = new QueryOptimizer();

module.exports = queryOptimizer;
