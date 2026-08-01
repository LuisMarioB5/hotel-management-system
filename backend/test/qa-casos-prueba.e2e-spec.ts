import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Suite de ejecución real (no simulada) para respaldar el documento
 * docs/qa/casos-prueba.md con resultados obtenidos por automatización.
 *
 * Se levanta la app completa (AppModule) EXACTAMENTE como en producción
 * (main.ts no registra ValidationPipe ni guards globales), contra la
 * base de datos MySQL local ya sembrada (backend/seed/hotel_management_db.sql).
 */
describe('QA — Casos de prueba (ejecución automatizada real)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const createdUserIds: number[] = [];
  const createdCustomerIds: number[] = [];
  const createdRoomIds: number[] = [];
  const createdBookingIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    // Limpieza de datos creados por esta suite para no ensuciar el seed.
    for (const id of createdBookingIds) {
      await dataSource.query('DELETE FROM bookings WHERE id = ?', [id]).catch(() => {});
    }
    for (const id of createdRoomIds) {
      await dataSource.query('DELETE FROM rooms WHERE id = ?', [id]).catch(() => {});
    }
    for (const id of createdCustomerIds) {
      await dataSource.query('DELETE FROM client_configuration WHERE customer_id = ?', [id]).catch(() => {});
      await dataSource.query('DELETE FROM customers WHERE id = ?', [id]).catch(() => {});
    }
    for (const id of createdUserIds) {
      await dataSource.query('DELETE FROM users WHERE id = ?', [id]).catch(() => {});
    }
    await app.close();
  });

  // ---------------------------------------------------------------------
  // HTL-AUTH-002/003/004 — bloqueo por 3 intentos fallidos
  // ---------------------------------------------------------------------
  describe('HTL-AUTH-002/003/004 — bloqueo de cuenta por intentos fallidos', () => {
    const username = `qa_auth_${Date.now()}`;
    const password = 'ClaveCorrecta#2026';

    beforeAll(async () => {
      const res = await request(app.getHttpServer()).post('/users/register').send({
        username,
        password,
        role: 'RECEPCIONISTA',
        isActive: true,
      });
      expect(res.status).toBe(201);
      createdUserIds.push(res.body.id);
    });

    it('HTL-AUTH-002: dos intentos con contraseña incorrecta no bloquean la cuenta', async () => {
      const r1 = await request(app.getHttpServer()).post('/auth/login').send({ username, password: 'Mala1' });
      const r2 = await request(app.getHttpServer()).post('/auth/login').send({ username, password: 'Mala2' });
      expect(r1.status).toBe(401);
      expect(r2.status).toBe(401);

      const [row] = await dataSource.query('SELECT isActive, failedLoginAttempts FROM users WHERE username = ?', [username]);
      expect(row.isActive).toBe(1);
      expect(row.failedLoginAttempts).toBe(2);
    });

    it('HTL-AUTH-003: el tercer intento fallido consecutivo bloquea la cuenta (isActive=false)', async () => {
      const r3 = await request(app.getHttpServer()).post('/auth/login').send({ username, password: 'Mala3' });
      expect(r3.status).toBe(401);

      const [row] = await dataSource.query('SELECT isActive FROM users WHERE username = ?', [username]);
      expect(row.isActive).toBe(0);
    });

    it('HTL-AUTH-004: login con contraseña CORRECTA sobre cuenta ya bloqueada debe seguir rechazando', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ username, password });
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------
  // HTL-USR-002 / HTL-USR-006 — usuarios
  // ---------------------------------------------------------------------
  describe('HTL-USR — duplicados y valores inválidos', () => {
    it('HTL-USR-002: username duplicado debe ser rechazado con un error controlado (no 500 crudo)', async () => {
      const username = `qa_dup_${Date.now()}`;
      const first = await request(app.getHttpServer()).post('/users/register').send({
        username,
        password: 'Clave123!',
        role: 'RECEPCIONISTA',
        isActive: true,
      });
      expect(first.status).toBe(201);
      createdUserIds.push(first.body.id);

      const second = await request(app.getHttpServer()).post('/users/register').send({
        username,
        password: 'OtraClave456!',
        role: 'RECEPCIONISTA',
        isActive: true,
      });

      // Documentamos el status real obtenido para el informe.
      // eslint-disable-next-line no-console
      console.log('[HTL-USR-002] status real al duplicar username:', second.status, second.body);
      expect(second.status).not.toBe(201);
    });

    it('HTL-USR-006: rol inválido vía API directa debería devolver 400', async () => {
      const res = await request(app.getHttpServer()).post('/users/register').send({
        username: `qa_rol_${Date.now()}`,
        password: 'Clave123!',
        role: 'SUPERADMIN',
        isActive: true,
      });
      // eslint-disable-next-line no-console
      console.log('[HTL-USR-006] status real con rol inválido:', res.status, res.body);
      if (res.status === 201) createdUserIds.push(res.body.id);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------
  // HTL-CLI-002 / HTL-CLI-004 — clientes
  // ---------------------------------------------------------------------
  describe('HTL-CLI — duplicados y formato de correo', () => {
    it('HTL-CLI-002: documentNumber duplicado debe ser rechazado con error controlado', async () => {
      const [existing] = await dataSource.query('SELECT documentNumber FROM customers LIMIT 1');
      const res = await request(app.getHttpServer()).post('/customers/register').send({
        name: 'QA',
        lastName: 'Duplicado',
        documentType: 'CEDULA',
        documentNumber: existing.documentNumber,
        email: `qa_dup_doc_${Date.now()}@example.com`,
      });
      // eslint-disable-next-line no-console
      console.log('[HTL-CLI-002] status real al duplicar documentNumber:', res.status, res.body);
      if (res.status === 201) createdCustomerIds.push(res.body.id);
      expect(res.status).not.toBe(201);
    });

    it('HTL-CLI-004: correo con formato inválido enviado directo a la API debería ser rechazado (400)', async () => {
      const res = await request(app.getHttpServer()).post('/customers/register').send({
        name: 'QA',
        lastName: 'CorreoInvalido',
        documentType: 'CEDULA',
        documentNumber: `QA-${Date.now()}`,
        email: 'correo-no-valido-sin-arroba',
      });
      // eslint-disable-next-line no-console
      console.log('[HTL-CLI-004] status real con email inválido:', res.status, res.body);
      if (res.status === 201) createdCustomerIds.push(res.body.id);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------
  // HTL-HAB-003 — precio negativo/cero
  // ---------------------------------------------------------------------
  describe('HTL-HAB-003 — precio de habitación negativo o cero', () => {
    it('precio negativo debería ser rechazado (400)', async () => {
      const res = await request(app.getHttpServer()).post('/rooms/register').send({
        number: 9001 + Math.floor(Math.random() * 1000),
        floor: 'PRIMER',
        type: 'INDIVIDUAL',
        price: -100,
      });
      // eslint-disable-next-line no-console
      console.log('[HTL-HAB-003] status real con precio negativo:', res.status, res.body);
      if (res.status === 201) createdRoomIds.push(res.body.id);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------
  // HTL-RES-002 / HTL-RES-003 — reservas: overlap y fecha pasada
  // ---------------------------------------------------------------------
  describe('HTL-RES — solapamiento de fechas y fecha pasada', () => {
    let customerId: number;
    let roomId: number;

    beforeAll(async () => {
      const customerRes = await request(app.getHttpServer()).post('/customers/register').send({
        name: 'QA',
        lastName: 'Reservas',
        documentType: 'CEDULA',
        documentNumber: `QA-RES-${Date.now()}`,
        email: `qa_res_${Date.now()}@example.com`,
      });
      customerId = customerRes.body.id;
      createdCustomerIds.push(customerId);

      const roomRes = await request(app.getHttpServer()).post('/rooms/register').send({
        number: 9500 + Math.floor(Math.random() * 400),
        floor: 'SEGUNDO',
        type: 'DOBLE',
        price: 2500,
        status: 'DISPONIBLE',
      });
      roomId = roomRes.body.id;
      createdRoomIds.push(roomId);
    });

    it('HTL-RES-002: no debe permitir crear una reserva con fechas solapadas a otra ya existente', async () => {
      const first = await request(app.getHttpServer()).post('/bookings/register').send({
        customerId,
        roomId,
        checkInDate: '2026-09-05',
        checkOutDate: '2026-09-10',
        status: 'CONFIRMADA',
      });
      expect(first.status).toBe(201);
      createdBookingIds.push(first.body.id);

      const overlapping = await request(app.getHttpServer()).post('/bookings/register').send({
        customerId,
        roomId,
        checkInDate: '2026-09-08',
        checkOutDate: '2026-09-12',
        status: 'PENDIENTE',
      });
      // eslint-disable-next-line no-console
      console.log('[HTL-RES-002] status real al solapar fechas:', overlapping.status, overlapping.body);
      if (overlapping.status === 201) createdBookingIds.push(overlapping.body.id);
      expect(overlapping.status).toBe(400);
    });

    it('HTL-RES-003: una reserva con checkInDate en el pasado no debería ser aceptada', async () => {
      const res = await request(app.getHttpServer()).post('/bookings/register').send({
        customerId,
        roomId,
        checkInDate: '2020-01-01',
        checkOutDate: '2020-01-05',
        status: 'PENDIENTE',
      });
      // eslint-disable-next-line no-console
      console.log('[HTL-RES-003] status real con fecha de check-in pasada:', res.status, res.body);
      if (res.status === 201) createdBookingIds.push(res.body.id);
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------
  // HTL-CUE-005 / HTL-CUE-009 — preferencias sin validación ni auth
  // ---------------------------------------------------------------------
  describe('HTL-CUE — validación de rango y autorización de endpoints', () => {
    let customerId: number;

    beforeAll(async () => {
      const customerRes = await request(app.getHttpServer()).post('/customers/register').send({
        name: 'QA',
        lastName: 'Cuestionario',
        documentType: 'CEDULA',
        documentNumber: `QA-CUE-${Date.now()}`,
        email: `qa_cue_${Date.now()}@example.com`,
      });
      customerId = customerRes.body.id;
      createdCustomerIds.push(customerId);
    });

    it('HTL-CUE-005: weight_level fuera de rango (1-5) debería ser rechazado por el backend', async () => {
      const res = await request(app.getHttpServer()).post('/preferences/save').send({
        customer_id: customerId,
        min_cost: 1000,
        max_cost: 3000,
        weight_level: 9,
        amenities: [],
      });
      // eslint-disable-next-line no-console
      console.log('[HTL-CUE-005] status real con weight_level=9:', res.status, res.body);
      expect(res.status).toBe(400);
    });

    it('HTL-CUE-009: GET /preferences/:customerId no debería responder sin autenticación', async () => {
      const res = await request(app.getHttpServer()).get(`/preferences/${customerId}`);
      // eslint-disable-next-line no-console
      console.log('[HTL-CUE-009] status real sin token de auth:', res.status, res.body);
      expect([401, 403]).toContain(res.status);
    });
  });
});
