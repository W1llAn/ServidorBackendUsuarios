const pool = require('../config/database');

class Usuario {
  static async findAll(page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.id, u.username, u.rol, u.id_departamento, 
             d.nombre as departamento_nombre
      FROM usuarios u
      LEFT JOIN departamentos d ON u.id_departamento = d.id
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      query += ` AND (u.username ILIKE $1 OR u.rol ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) FROM usuarios WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (username ILIKE $1 OR rol ILIKE $1)';
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(id) {
    const query = `
      SELECT u.id, u.username, u.rol, u.id_departamento,
             d.nombre as departamento_nombre
      FROM usuarios u
      LEFT JOIN departamentos d ON u.id_departamento = d.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM usuarios WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async create(userData) {
    const query = `
      INSERT INTO usuarios (username, password, rol, id_departamento)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, rol, id_departamento
    `;
    const values = [
      userData.username,
      userData.password,
      userData.rol,
      userData.id_departamento
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.username !== undefined) {
      fields.push(`username = $${paramCount}`);
      values.push(userData.username);
      paramCount++;
    }
    if (userData.password !== undefined) {
      fields.push(`password = $${paramCount}`);
      values.push(userData.password);
      paramCount++;
    }
    if (userData.rol !== undefined) {
      fields.push(`rol = $${paramCount}`);
      values.push(userData.rol);
      paramCount++;
    }
    if (userData.id_departamento !== undefined) {
      fields.push(`id_departamento = $${paramCount}`);
      values.push(userData.id_departamento);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE usuarios 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, rol, id_departamento
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async search(searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT u.id, u.username, u.rol, u.id_departamento,
             d.nombre as departamento_nombre
      FROM usuarios u
      LEFT JOIN departamentos d ON u.id_departamento = d.id
      WHERE u.username ILIKE $1 OR u.rol ILIKE $1
      ORDER BY u.id
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
    
    const countQuery = `
      SELECT COUNT(*) FROM usuarios 
      WHERE username ILIKE $1 OR rol ILIKE $1
    `;
    const countResult = await pool.query(countQuery, [`%${searchTerm}%`]);
    const total = parseInt(countResult.rows[0].count);
    
    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = Usuario;
