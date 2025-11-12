const pool = require('../config/database');

class Departamento {
  static async findAll(page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM departamentos WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (nombre ILIKE $1 OR descripcion ILIKE $1)';
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) FROM departamentos WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (nombre ILIKE $1 OR descripcion ILIKE $1)';
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
    const query = 'SELECT * FROM departamentos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByNombre(nombre) {
    const query = 'SELECT * FROM departamentos WHERE nombre = $1';
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  }

  static async create(departamentoData) {
    const query = `
      INSERT INTO departamentos (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [
      departamentoData.nombre,
      departamentoData.descripcion
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, departamentoData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (departamentoData.nombre !== undefined) {
      fields.push(`nombre = $${paramCount}`);
      values.push(departamentoData.nombre);
      paramCount++;
    }
    if (departamentoData.descripcion !== undefined) {
      fields.push(`descripcion = $${paramCount}`);
      values.push(departamentoData.descripcion);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE departamentos 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM departamentos WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async search(searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM departamentos
      WHERE nombre ILIKE $1 OR descripcion ILIKE $1
      ORDER BY id
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
    
    const countQuery = `
      SELECT COUNT(*) FROM departamentos 
      WHERE nombre ILIKE $1 OR descripcion ILIKE $1
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

  static async getUsersCount(id) {
    const query = 'SELECT COUNT(*) FROM usuarios WHERE id_departamento = $1';
    const result = await pool.query(query, [id]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = Departamento;
