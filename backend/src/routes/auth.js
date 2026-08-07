import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authRequired } from '../middleware/auth.js';
import {
  isCargoAllowedForRegister,
  isEmployeeActive,
  normalizeMatricula,
  roleFromCargo,
} from '../lib/qlp.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, matricula: user.matricula },
    process.env.JWT_SECRET,
    { expiresIn: '12h' },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    matricula: user.matricula,
    role: user.role,
  };
}

router.post('/login', async (req, res) => {
  try {
    const matricula = normalizeMatricula(req.body.matricula || req.body.email);
    const { password } = req.body;
    if (!matricula || !password) {
      return res.status(400).json({ error: 'Matrícula e senha são obrigatórios' });
    }

    let user = await prisma.user.findUnique({ where: { matricula } });
    // Compatibilidade: ainda aceita e-mail no campo matrícula
    if (!user && String(req.body.matricula || req.body.email || '').includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: String(req.body.matricula || req.body.email).toLowerCase() },
      });
    }

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/qlp/:matricula', async (req, res) => {
  try {
    const matricula = normalizeMatricula(req.params.matricula);
    const employee = await prisma.employee.findUnique({ where: { matricula } });
    if (!employee) {
      return res.status(404).json({ error: 'Matrícula não encontrada no QLP' });
    }
    if (!isEmployeeActive(employee.status)) {
      return res.status(400).json({ error: 'Colaborador não está ativo no QLP' });
    }
    if (!isCargoAllowedForRegister(employee.cargo)) {
      return res.status(403).json({
        error: 'Matrícula sem permissão de cadastro neste sistema (cargo não autorizado)',
        cargo: employee.cargo,
      });
    }
    const existing = await prisma.user.findUnique({ where: { matricula } });
    res.json({
      matricula: employee.matricula,
      nome: employee.nome,
      cargo: employee.cargo,
      unidade: employee.unidade,
      setor: employee.setor,
      alreadyRegistered: Boolean(existing),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const matricula = normalizeMatricula(req.body.matricula);
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!matricula || !email || !password) {
      return res.status(400).json({ error: 'Matrícula, e-mail e senha são obrigatórios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const employee = await prisma.employee.findUnique({ where: { matricula } });
    if (!employee) {
      return res.status(404).json({ error: 'Matrícula não encontrada no QLP' });
    }
    if (!isEmployeeActive(employee.status)) {
      return res.status(400).json({ error: 'Colaborador não está ativo no QLP' });
    }
    if (!isCargoAllowedForRegister(employee.cargo)) {
      return res.status(403).json({ error: 'Cargo não autorizado para cadastro neste sistema' });
    }

    const dupMat = await prisma.user.findUnique({ where: { matricula } });
    if (dupMat) return res.status(409).json({ error: 'Já existe conta para esta matrícula' });
    const dupEmail = await prisma.user.findUnique({ where: { email } });
    if (dupEmail) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: employee.nome,
        email,
        matricula,
        passwordHash,
        role: roleFromCargo(employee.cargo),
      },
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const matricula = normalizeMatricula(req.body.matricula);
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || req.body.newPassword || '');
    if (!matricula || !email || !password) {
      return res.status(400).json({ error: 'Matrícula, e-mail e nova senha são obrigatórios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { matricula } });
    if (!user || user.email.toLowerCase() !== email) {
      return res.status(400).json({ error: 'Matrícula e e-mail não conferem' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true, message: 'Senha atualizada. Faça login com a nova senha.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, matricula: true, role: true, active: true, createdAt: true },
  });
  res.json(user);
});

export default router;
