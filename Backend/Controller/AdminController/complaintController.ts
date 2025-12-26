import express from 'express';
import prisma from '../../lib/prisma';
import { Request, Response } from 'express';

// Helper function to get complainant details
const getComplainantDetails = async (type: string, id: number) => {
  if (type === 'CUSTOMER') {
    return await prisma.customer.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        mobileNumber: true,
        cusProfileImg: true 
      }
    });
  } else if (type === 'SELLER') {
    return await prisma.seller.findUnique({
      where: { seller_id: id },
      select: { 
        seller_id: true, 
        businessName: true, 
        businessEmail: true, 
        phoneNum: true,
        storeImg: true 
      }
    });
  }
  return null;
};

// Helper function to get accused details
const getAccusedDetails = async (type: string, id: number) => {
  if (type === 'CUSTOMER') {
    return await prisma.customer.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        mobileNumber: true 
      }
    });
  } else if (type === 'SELLER') {
    return await prisma.seller.findUnique({
      where: { seller_id: id },
      select: { 
        seller_id: true, 
        businessName: true, 
        businessEmail: true, 
        phoneNum: true 
      }
    });
  }
  return null;
};

// Helper function to record status change
const recordStatusChange = async (
  complaintId: number, 
  oldStatus: string | null, 
  newStatus: string, 
  adminId: number, 
  note?: string
) => {
  await prisma.complaintStatusHistory.create({
    data: {
      complaintId,
      oldStatus: oldStatus as any,
      newStatus: newStatus as any,
      changedBy: adminId,
      note
    }
  });
};

// Get all complaints with filters
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const {
      page = '1',
      limit = '10',
      status,
      priority,
      type,
      complainantType,
      search,
      startDate,
      endDate
    } = req.query;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Apply filters
    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (type && type !== 'all') {
      where.complaintType = type;
    }

    if (complainantType && complainantType !== 'all') {
      where.complainantType = complainantType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { complaintCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Get complaints with pagination
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          order: {
            select: {
              order_id: true,
              totalAmount: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.complaint.count({ where }),
    ]);

    // Enrich complaints with user details
    const enrichedComplaints = await Promise.all(
      complaints.map(async (complaint) => {
        const complainant = await getComplainantDetails(
          complaint.complainantType,
          complaint.complainantId
        );
        const accused = await getAccusedDetails(
          complaint.accusedType,
          complaint.accusedId
        );

        return {
          ...complaint,
          complainant,
          accused,
        };
      })
    );

    return res.status(200).json({
      complaints: enrichedComplaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      message: "Complaints fetched successfully",
    });
  } catch (error: any) {
    console.error("Get all complaints error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get complaint by ID with full details
export const getComplaintById = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const { id } = req.params;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        attachments: true,
        notes: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        statusHistory: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Get complainant and accused details
    const complainant = await getComplainantDetails(
      complaint.complainantType,
      complaint.complainantId
    );
    const accused = await getAccusedDetails(
      complaint.accusedType,
      complaint.accusedId
    );

    const complaintWithDetails = {
      ...complaint,
      complainant,
      accused,
    };

    return res.status(200).json({
      complaint: complaintWithDetails,
      message: "Complaint details fetched successfully",
    });
  } catch (error: any) {
    console.error("Get complaint by ID error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new complaint
export const createComplaint = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      complaintType,
      priority,
      complainantType,
      complainantId,
      accusedType,
      accusedId,
      orderId,
    } = req.body;

    // Validate required fields
    if (!title || !description || !complaintType || !complainantType || !complainantId || !accusedType || !accusedId) {
      return res.status(400).json({
        message: "Missing required fields: title, description, complaintType, complainantType, complainantId, accusedType, accusedId",
      });
    }

    // Validate complainant exists
    if (complainantType === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { id: complainantId },
      });
      if (!customer) {
        return res.status(404).json({ message: "Complainant customer not found" });
      }
    } else if (complainantType === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { seller_id: complainantId },
      });
      if (!seller) {
        return res.status(404).json({ message: "Complainant seller not found" });
      }
    }

    // Validate accused exists
    if (accusedType === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { id: accusedId },
      });
      if (!customer) {
        return res.status(404).json({ message: "Accused customer not found" });
      }
    } else if (accusedType === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { seller_id: accusedId },
      });
      if (!seller) {
        return res.status(404).json({ message: "Accused seller not found" });
      }
    }

    // Validate order if provided
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { order_id: orderId },
      });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        complaintType,
        priority: priority || 'MEDIUM',
        complainantType,
        complainantId,
        accusedType,
        accusedId,
        orderId: orderId || null,
      },
    });

    // Record initial status change
    await recordStatusChange(complaint.id, null, 'PENDING', req.user?.id || 0, "Complaint created");

    return res.status(201).json({
      complaint,
      message: "Complaint created successfully",
    });
  } catch (error: any) {
    console.error("Create complaint error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update complaint
export const updateComplaint = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { status, priority, assignedTo, note } = req.body;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const updateData: any = {};
    
    if (status && status !== complaint.status) {
      updateData.status = status;
    }
    
    if (priority) {
      updateData.priority = priority;
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Record status change if status was updated
    if (status && status !== complaint.status) {
      await recordStatusChange(
        parseInt(id),
        complaint.status,
        status,
        admin.id,
        note || "Status updated"
      );
    }

    // Add note if provided
    if (note) {
      await prisma.complaintNote.create({
        data: {
          complaintId: parseInt(id),
          adminId: admin.id,
          note,
          isInternal: true,
        },
      });
    }

    return res.status(200).json({
      complaint: updatedComplaint,
      message: "Complaint updated successfully",
    });
  } catch (error: any) {
    console.error("Update complaint error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Resolve complaint
export const resolveComplaint = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { resolution, actionTaken, followUpRequired, followUpDate, status } = req.body;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    if (!resolution || !actionTaken) {
      return res.status(400).json({
        message: "Resolution and action taken are required",
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const updateData: any = {
      resolution,
      actionTaken,
      resolvedAt: new Date(),
      resolvedBy: admin.id,
      followUpRequired: followUpRequired || false,
      status: status || 'RESOLVED',
    };

    if (followUpRequired && followUpDate) {
      updateData.followUpDate = new Date(followUpDate);
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Record status change
    await recordStatusChange(
      parseInt(id),
      complaint.status,
      status || 'RESOLVED',
      admin.id,
      `Complaint resolved: ${resolution.substring(0, 100)}...`
    );

    return res.status(200).json({
      complaint: updatedComplaint,
      message: "Complaint resolved successfully",
    });
  } catch (error: any) {
    console.error("Resolve complaint error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add note to complaint
export const addComplaintNote = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { note, isInternal = false } = req.body;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    if (!note) {
      return res.status(400).json({ message: "Note is required" });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const complaintNote = await prisma.complaintNote.create({
      data: {
        complaintId: parseInt(id),
        adminId: admin.id,
        note,
        isInternal,
      },
    });

    return res.status(201).json({
      note: complaintNote,
      message: "Note added successfully",
    });
  } catch (error: any) {
    console.error("Add complaint note error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get complaint statistics
export const getComplaintStats = async (req: Request, res: Response) => {
  try {
    const admin = req.user;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // Get total counts by status
    const counts = await prisma.complaint.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Get total complaints
    const total = await prisma.complaint.count();

    // Get complaints by type
    const byType = await prisma.complaint.groupBy({
      by: ['complaintType'],
      _count: {
        id: true,
      },
    });

    // Get complaints by priority
    const byPriority = await prisma.complaint.groupBy({
      by: ['priority'],
      _count: {
        id: true,
      },
    });

    // Get monthly statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyStats = await prisma.complaint.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Calculate average resolution time (for resolved complaints)
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, complaint) => {
        const created = new Date(complaint.createdAt).getTime();
        const resolved = new Date(complaint.resolvedAt!).getTime();
        return sum + ((resolved - created) / (1000 * 60 * 60)); // Convert to hours
      }, 0);
      avgResolutionTime = totalHours / resolvedComplaints.length;
    }

    // Get pending complaints by age
    const pendingComplaints = await prisma.complaint.findMany({
      where: {
        status: { in: ['PENDING', 'IN_REVIEW', 'IN_PROGRESS'] },
      },
      select: {
        createdAt: true,
      },
    });

    const avgWaitTime = pendingComplaints.length > 0
      ? pendingComplaints.reduce((sum, complaint) => {
          const created = new Date(complaint.createdAt).getTime();
          const now = Date.now();
          return sum + ((now - created) / (1000 * 60 * 60)); // Convert to hours
        }, 0) / pendingComplaints.length
      : 0;

    // Get resolution rate (last 30 days)
    const recentComplaints = await prisma.complaint.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const recentResolved = await prisma.complaint.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
    });

    const resolutionRate = recentComplaints > 0 
      ? (recentResolved / recentComplaints) * 100 
      : 0;

    // Get complaints by complainant type
    const byComplainantType = await prisma.complaint.groupBy({
      by: ['complainantType'],
      _count: {
        id: true,
      },
    });

    const stats = {
      total,
      byStatus: counts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, item) => {
        acc[item.complaintType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      monthlyCount: monthlyStats._count.id,
      avgResolutionTime: parseFloat(avgResolutionTime.toFixed(2)),
      avgWaitTime: parseFloat(avgWaitTime.toFixed(2)),
      resolutionRate: parseFloat(resolutionRate.toFixed(2)),
      byComplainantType: byComplainantType.reduce((acc, item) => {
        acc[item.complainantType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      pendingCount: counts.find(c => c.status === 'PENDING')?._count.id || 0,
      resolvedCount: counts.find(c => c.status === 'RESOLVED')?._count.id || 0 +
                  counts.find(c => c.status === 'CLOSED')?._count.id || 0,
    };

    return res.status(200).json({
      stats,
      message: "Complaint statistics fetched successfully",
    });
  } catch (error: any) {
    console.error("Get complaint stats error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get complaint analytics
export const getComplaintAnalytics = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const { period = 'month', type = 'overview' } = req.query;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    if (type === 'types') {
      // Get complaint type distribution
      const complaints = await prisma.complaint.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          complaintType: true,
        },
      });

      const typeDistribution = complaints.reduce((acc, complaint) => {
        acc[complaint.complaintType] = (acc[complaint.complaintType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convert to array format for charts
      const typeData = Object.entries(typeDistribution).map(([type, count]) => ({
        name: type,
        value: count,
        percentage: (count / complaints.length) * 100,
      }));

      return res.status(200).json({
        analytics: {
          type: 'types',
          data: typeData,
          total: complaints.length,
        },
        message: "Complaint type analytics fetched successfully",
      });
    } else if (type === 'timeline') {
      // Get resolution timeline data
      const resolvedComplaints = await prisma.complaint.findMany({
        where: {
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { not: null },
          createdAt: { gte: startDate },
        },
        select: {
          complaintType: true,
          createdAt: true,
          resolvedAt: true,
        },
      });

      // Calculate average resolution time by type
      const timelineData = resolvedComplaints.reduce((acc, complaint) => {
        const created = new Date(complaint.createdAt).getTime();
        const resolved = new Date(complaint.resolvedAt!).getTime();
        const hours = (resolved - created) / (1000 * 60 * 60);

        if (!acc[complaint.complaintType]) {
          acc[complaint.complaintType] = {
            totalHours: 0,
            count: 0,
          };
        }

        acc[complaint.complaintType].totalHours += hours;
        acc[complaint.complaintType].count += 1;

        return acc;
      }, {} as Record<string, { totalHours: number; count: number }>);

      // Convert to array format
      const timeline = Object.entries(timelineData).map(([type, data]) => ({
        type,
        avgHours: parseFloat((data.totalHours / data.count).toFixed(2)),
        count: data.count,
      }));

      return res.status(200).json({
        analytics: {
          type: 'timeline',
          data: timeline,
        },
        message: "Resolution timeline analytics fetched successfully",
      });
    } else {
      // Default overview analytics
      const complaints = await prisma.complaint.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          status: true,
          complaintType: true,
          priority: true,
          createdAt: true,
          resolvedAt: true,
        },
      });

      // Calculate various metrics
      const total = complaints.length;
      const resolved = complaints.filter(c => 
        c.status === 'RESOLVED' || c.status === 'CLOSED'
      ).length;
      
      const pending = complaints.filter(c => 
        c.status === 'PENDING' || c.status === 'IN_REVIEW' || c.status === 'IN_PROGRESS'
      ).length;

      // Calculate resolution time for resolved complaints
      const resolvedWithTime = complaints.filter(c => 
        (c.status === 'RESOLVED' || c.status === 'CLOSED') && c.resolvedAt
      );
      
      let avgResolutionHours = 0;
      if (resolvedWithTime.length > 0) {
        const totalHours = resolvedWithTime.reduce((sum, complaint) => {
          const created = new Date(complaint.createdAt).getTime();
          const resolved = new Date(complaint.resolvedAt!).getTime();
          return sum + ((resolved - created) / (1000 * 60 * 60));
        }, 0);
        avgResolutionHours = totalHours / resolvedWithTime.length;
      }

      // Group by complaint type
      const byType = complaints.reduce((acc, complaint) => {
        acc[complaint.complaintType] = (acc[complaint.complaintType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by priority
      const byPriority = complaints.reduce((acc, complaint) => {
        acc[complaint.priority] = (acc[complaint.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by status
      const byStatus = complaints.reduce((acc, complaint) => {
        acc[complaint.status] = (acc[complaint.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const overview = {
        total,
        resolved,
        pending,
        resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
        avgResolutionTime: parseFloat(avgResolutionHours.toFixed(2)),
        byType,
        byPriority,
        byStatus,
      };

      return res.status(200).json({
        analytics: {
          type: 'overview',
          data: overview,
        },
        message: "Complaint overview analytics fetched successfully",
      });
    }
  } catch (error: any) {
    console.error("Get complaint analytics error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete complaint
export const deleteComplaint = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const { id } = req.params;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Only allow deletion of complaints that are not in progress
    if (complaint.status === 'IN_PROGRESS' || complaint.status === 'IN_REVIEW') {
      return res.status(400).json({
        message: "Cannot delete complaint that is in progress or under review",
      });
    }

    // Delete related records first (if cascade delete is not set up)
    await prisma.complaintNote.deleteMany({
      where: { complaintId: parseInt(id) },
    });

    await prisma.complaintStatusHistory.deleteMany({
      where: { complaintId: parseInt(id) },
    });

    await prisma.complaintAttachment.deleteMany({
      where: { complaintId: parseInt(id) },
    });

    // Delete the complaint
    await prisma.complaint.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      message: "Complaint deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete complaint error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export complaints
export const exportComplaints = async (req: Request, res: Response) => {
  try {
    const admin = req.user;
    const { format = 'csv' } = req.query;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const complaints = await prisma.complaint.findMany({
      include: {
        admin: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const csvData = complaints.map(complaint => ({
        'Complaint ID': complaint.complaintCode,
        'Title': complaint.title,
        'Type': complaint.complaintType,
        'Priority': complaint.priority,
        'Status': complaint.status,
        'Complainant Type': complaint.complainantType,
        'Complainant ID': complaint.complainantId,
        'Accused Type': complaint.accusedType,
        'Accused ID': complaint.accusedId,
        'Created At': complaint.createdAt.toISOString(),
        'Resolved At': complaint.resolvedAt?.toISOString() || '',
        'Resolved By': complaint.admin?.name || '',
        'Resolution': complaint.resolution || '',
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {});
      const csv = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => 
          `"${String(row[header as keyof typeof row] || '').replace(/"/g, '""')}"`
        ).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=complaints.csv');
      return res.send(csv);
    } else if (format === 'json') {
      // Return JSON
      return res.status(200).json({
        complaints,
        message: "Complaints exported successfully",
      });
    } else {
      return res.status(400).json({
        message: "Unsupported export format. Use 'csv' or 'json'",
      });
    }
  } catch (error: any) {
    console.error("Export complaints error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};