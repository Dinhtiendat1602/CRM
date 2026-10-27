const db = require('../config/db');

/**
 * Controller Quản lý Khách hàng tiềm năng (Leads Module)
 * Tuân thủ SRS v1.1 Mục 3.1 - 3.5 và các ràng buộc nghiệp vụ BR-01, BR-02, BR-03, BR-04, BR-05
 */

/**
 * SRS 3.2, 3.3: Lấy danh sách Khách hàng tiềm năng
 * - Phân trang mặc định 20 bản ghi mới nhất (BR-03, SRS 3.2.3 REQ-1)
 * - Sắp xếp theo ngày nhập (BR-04, SRS 3.2.3 REQ-2)
 * - Lọc theo ngày nhập (BR-05, SRS 3.2.3 REQ-3)
 * - Tìm kiếm theo tên hoặc một phần tên (SRS 3.3)
 * GET /api/leads
 */
exports.getLeads = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20); // Mặc định 20 dòng
    const offset = (page - 1) * limit;

    const {
      search,
      from_date,
      to_date,
      startDate,
      endDate,
      all_time,
      campaign_id,
      assigned_to,
      sortBy = 'entered_date',
      sortOrder = 'DESC',
    } = req.query;

    const conditions = [];
    const values = [];

    // Tìm kiếm theo tên hoặc một phần tên (SRS 3.3)
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const idx = values.length;
      conditions.push(
        `(l.first_name ILIKE $${idx} OR l.last_name ILIKE $${idx} OR (l.first_name || ' ' || l.last_name) ILIKE $${idx} OR (l.last_name || ' ' || l.first_name) ILIKE $${idx} OR l.email ILIKE $${idx} OR l.phone ILIKE $${idx})`
      );
    }

    const effectiveFromDate = from_date || startDate;
    const effectiveToDate = to_date || endDate;

    // Lọc theo ngày nhập: từ ngày (BR-05, SRS 3.2.3 REQ-3)
    if (effectiveFromDate) {
      values.push(effectiveFromDate);
      conditions.push(`l.entered_date >= $${values.length}::timestamp`);
    }

    // Lọc theo ngày nhập: đến ngày (BR-05)
    if (effectiveToDate) {
      values.push(effectiveToDate);
      // Nếu to_date chỉ là YYYY-MM-DD, chuyển thành hết ngày 23:59:59
      conditions.push(`l.entered_date <= ($${values.length}::date + INTERVAL '1 day' - INTERVAL '1 second')`);
    }

    // Tối ưu query khi mở ứng dụng: Mặc định trong vòng 1 năm gần nhất nếu không chọn ngày
    if (!effectiveFromDate && !effectiveToDate && all_time !== 'true') {
      conditions.push(`l.entered_date >= (CURRENT_TIMESTAMP - INTERVAL '1 year')`);
    }

    // Lọc theo chiến dịch
    if (campaign_id) {
      values.push(parseInt(campaign_id, 10));
      conditions.push(`l.campaign_id = $${values.length}`);
    }

    // Lọc theo nhân viên phụ trách
    if (assigned_to) {
      values.push(parseInt(assigned_to, 10));
      conditions.push(`l.assigned_to = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Ràng buộc cột sắp xếp an toàn
    const allowedSortFields = ['entered_date', 'first_name', 'last_name', 'id'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? `l.${sortBy}` : 'l.entered_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Đếm tổng số bản ghi
    const countQuery = `SELECT COUNT(*) AS total FROM leads l ${whereClause};`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    // Truy vấn dữ liệu có phân trang, JOIN bảng campaigns, users và tính số cơ hội liên quan
    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const dataQuery = `
      SELECT
        l.id,
        l.first_name,
        l.last_name,
        (l.last_name || ' ' || l.first_name) AS full_name,
        l.email,
        l.phone,
        l.date_of_birth,
        l.career,
        l.address,
        l.campaign_id,
        c.name AS campaign_name,
        l.assigned_to,
        u.full_name AS assigned_to_name,
        l.entered_date,
        l.updated_at,
        COALESCE(opp.opp_count, 0)::int AS opportunities_count
      FROM leads l
      LEFT JOIN campaigns c ON l.campaign_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN (
        SELECT lead_id, COUNT(*) AS opp_count
        FROM opportunities
        GROUP BY lead_id
      ) opp ON l.id = opp.lead_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const dataResult = await db.query(dataQuery, values);

    return res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.2.3 REQ-4: Xem chi tiết Khách tiềm năng kèm danh sách Cơ hội liên quan
 * GET /api/leads/:id
 */
exports.getLeadById = async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã khách hàng không hợp lệ.',
      });
    }

    // 1. Lấy thông tin Lead
    const leadQuery = `
      SELECT
        l.id,
        l.first_name,
        l.last_name,
        (l.last_name || ' ' || l.first_name) AS full_name,
        l.email,
        l.phone,
        l.date_of_birth,
        l.career,
        l.address,
        l.campaign_id,
        c.name AS campaign_name,
        l.assigned_to,
        u.full_name AS assigned_to_name,
        l.entered_date,
        l.updated_at
      FROM leads l
      LEFT JOIN campaigns c ON l.campaign_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1;
    `;
    const leadResult = await db.query(leadQuery, [leadId]);

    if (leadResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng tiềm năng.',
      });
    }

    const lead = leadResult.rows[0];

    // 2. Lấy danh sách Cơ hội liên quan (SRS 3.2.3 REQ-4)
    const oppQuery = `
      SELECT
        o.id,
        o.product_id,
        p.name AS product_name,
        p.product_code,
        p.unit_price,
        o.quantity,
        (o.quantity * p.unit_price) AS estimated_amount,
        o.expected_close_date,
        o.status,
        o.notes,
        o.created_by,
        u.full_name AS created_by_name,
        o.created_at,
        o.updated_at
      FROM opportunities o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.lead_id = $1
      ORDER BY o.created_at DESC;
    `;
    const oppResult = await db.query(oppQuery, [leadId]);

    return res.status(200).json({
      success: true,
      data: {
        ...lead,
        opportunities: oppResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra trùng lặp email hoặc SĐT (BR-02, SRS 3.1.2 REQ-4)
 * GET /api/leads/check-duplicate?email=...&phone=...&excludeId=...
 */
exports.checkDuplicate = async (req, res, next) => {
  try {
    const { email, phone, excludeId } = req.query;

    if (!email && !phone) {
      return res.status(200).json({
        success: true,
        isDuplicate: false,
      });
    }

    const conditions = [];
    const values = [];

    if (email && email.trim()) {
      values.push(email.trim().toLowerCase());
      conditions.push(`LOWER(email) = $${values.length}`);
    }

    if (phone && phone.trim()) {
      values.push(phone.trim());
      conditions.push(`phone = $${values.length}`);
    }

    let query = `SELECT id, first_name, last_name, email, phone FROM leads WHERE (${conditions.join(' OR ')})`;

    if (excludeId) {
      values.push(parseInt(excludeId, 10));
      query += ` AND id != $${values.length}`;
    }

    const result = await db.query(query, values);

    if (result.rows.length > 0) {
      const match = result.rows[0];
      const matchEmail = email && match.email.toLowerCase() === email.trim().toLowerCase();
      const matchPhone = phone && match.phone === phone.trim();

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        duplicateField: matchEmail && matchPhone ? 'both' : matchEmail ? 'email' : 'phone',
        existingLead: {
          id: match.id,
          name: `${match.last_name} ${match.first_name}`,
          email: match.email,
          phone: match.phone,
        },
      });
    }

    return res.status(200).json({
      success: true,
      isDuplicate: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.1: Thêm Lead mới
 * - Bắt buộc các trường: first_name, last_name, email, phone (BR-01, SRS 3.1.2 REQ-2)
 * - Kiểm tra trùng lặp SĐT/Email trả về HTTP 409 (BR-02, SRS 3.1.2 REQ-4)
 * POST /api/leads
 */
exports.createLead = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      career,
      address,
      campaign_id,
      assigned_to,
    } = req.body;

    // 1. Kiểm tra trường bắt buộc (BR-01)
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các trường bắt buộc (*): Họ, Tên, Email và Số điện thoại.',
      });
    }

    // 2. Validate định dạng email (BR-01)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ.',
      });
    }

    // 3. Kiểm tra chống trùng lặp theo Email hoặc SĐT (BR-02, SRS 3.1.2 REQ-4)
    const duplicateCheckQuery = `
      SELECT id, first_name, last_name, email, phone
      FROM leads
      WHERE LOWER(email) = LOWER($1) OR phone = $2;
    `;
    const duplicateResult = await db.query(duplicateCheckQuery, [email.trim(), phone.trim()]);

    if (duplicateResult.rows.length > 0) {
      const existing = duplicateResult.rows[0];
      const field = existing.email.toLowerCase() === email.trim().toLowerCase() ? 'Email' : 'Số điện thoại';
      return res.status(409).json({
        success: false,
        message: `Khách hàng tiềm năng với ${field} này đã tồn tại trong hệ thống (phát hiện trùng lặp dữ liệu).`,
        existingLead: {
          id: existing.id,
          name: `${existing.last_name} ${existing.first_name}`,
          email: existing.email,
          phone: existing.phone,
        },
      });
    }

    // 4. Gán người phụ trách & Chiến dịch (xác thực khóa ngoại an toàn trong CSDL)
    let finalAssignedTo = null;
    const targetUserId = assigned_to ? parseInt(assigned_to, 10) : req.user?.id;
    if (targetUserId) {
      const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
      if (userCheck.rows.length > 0) {
        finalAssignedTo = userCheck.rows[0].id;
      }
    }

    let finalCampaignId = null;
    if (campaign_id) {
      const campCheck = await db.query('SELECT id FROM campaigns WHERE id = $1', [parseInt(campaign_id, 10)]);
      if (campCheck.rows.length > 0) {
        finalCampaignId = campCheck.rows[0].id;
      }
    }

    // 5. Thêm bản ghi vào CSDL
    const insertQuery = `
      INSERT INTO leads (
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        career,
        address,
        campaign_id,
        assigned_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const cleanDob = (date_of_birth && String(date_of_birth).trim() !== '') ? String(date_of_birth).trim() : null;
    const cleanCareer = (career || req.body.title || '').trim() || null;
    const cleanAddress = (address || '').trim() || null;

    const insertValues = [
      first_name.trim(),
      last_name.trim(),
      email.trim(),
      phone.trim(),
      cleanDob,
      cleanCareer,
      cleanAddress,
      finalCampaignId,
      finalAssignedTo,
    ];

    const result = await db.query(insertQuery, insertValues);

    return res.status(201).json({
      success: true,
      message: 'Thêm khách hàng tiềm năng thành công.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.4: Sửa thông tin Khách tiềm năng
 * - Xác thực toàn bộ dữ liệu mới (BR-01)
 * - Kiểm tra trùng lặp email/phone loại trừ chính bản ghi đang sửa (BR-02)
 * PUT /api/leads/:id
 */
exports.updateLead = async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã khách hàng không hợp lệ.',
      });
    }

    // 1. Kiểm tra Lead có tồn tại không
    const existingCheck = await db.query('SELECT * FROM leads WHERE id = $1;', [leadId]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng tiềm năng để cập nhật.',
      });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      career,
      address,
      campaign_id,
      assigned_to,
    } = req.body;

    // 2. Validate trường bắt buộc (BR-01)
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các trường bắt buộc (*): Họ, Tên, Email và Số điện thoại.',
      });
    }

    // 3. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ.',
      });
    }

    // 4. Kiểm tra trùng lặp Email hoặc SĐT với các Lead khác (BR-02)
    const duplicateQuery = `
      SELECT id, first_name, last_name, email, phone
      FROM leads
      WHERE (LOWER(email) = LOWER($1) OR phone = $2) AND id != $3;
    `;
    const duplicateResult = await db.query(duplicateQuery, [email.trim(), phone.trim(), leadId]);

    if (duplicateResult.rows.length > 0) {
      const existing = duplicateResult.rows[0];
      const field = existing.email.toLowerCase() === email.trim().toLowerCase() ? 'Email' : 'Số điện thoại';
      return res.status(409).json({
        success: false,
        message: `${field} này đã được sử dụng bởi khách hàng khác trong hệ thống.`,
        existingLead: {
          id: existing.id,
          name: `${existing.last_name} ${existing.first_name}`,
        },
      });
    }

    // 5. Cập nhật vào CSDL
    let finalAssignedTo = existingCheck.rows[0].assigned_to;
    if (assigned_to !== undefined) {
      if (assigned_to) {
        const uCheck = await db.query('SELECT id FROM users WHERE id = $1', [parseInt(assigned_to, 10)]);
        finalAssignedTo = uCheck.rows.length > 0 ? uCheck.rows[0].id : null;
      } else {
        finalAssignedTo = null;
      }
    }

    let finalCampaignId = existingCheck.rows[0].campaign_id;
    if (campaign_id !== undefined) {
      if (campaign_id) {
        const cCheck = await db.query('SELECT id FROM campaigns WHERE id = $1', [parseInt(campaign_id, 10)]);
        finalCampaignId = cCheck.rows.length > 0 ? cCheck.rows[0].id : null;
      } else {
        finalCampaignId = null;
      }
    }

    const updateQuery = `
      UPDATE leads
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        date_of_birth = $5,
        career = $6,
        address = $7,
        campaign_id = $8,
        assigned_to = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *;
    `;

    const cleanDob = (date_of_birth && String(date_of_birth).trim() !== '') ? String(date_of_birth).trim() : null;
    const cleanCareer = (career || req.body.title || '').trim() || null;
    const cleanAddress = (address || '').trim() || null;

    const updateValues = [
      first_name.trim(),
      last_name.trim(),
      email.trim(),
      phone.trim(),
      cleanDob,
      cleanCareer,
      cleanAddress,
      finalCampaignId,
      finalAssignedTo,
      leadId,
    ];

    const result = await db.query(updateQuery, updateValues);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin khách hàng tiềm năng thành công.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.5: Xóa Khách tiềm năng
 * DELETE /api/leads/:id
 */
exports.deleteLead = async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã khách hàng không hợp lệ.',
      });
    }

    // Kiểm tra tồn tại trước khi xóa
    const checkResult = await db.query('SELECT id, first_name, last_name FROM leads WHERE id = $1;', [leadId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng tiềm năng để xóa.',
      });
    }

    const lead = checkResult.rows[0];

    // Thực hiện xóa (các bản ghi liên quan trong opportunities sẽ tự động CASCADE theo schema FK)
    await db.query('DELETE FROM leads WHERE id = $1;', [leadId]);

    return res.status(200).json({
      success: true,
      message: `Đã xóa khách hàng tiềm năng "${lead.last_name} ${lead.first_name}" thành công.`,
    });
  } catch (error) {
    next(error);
  }
};
