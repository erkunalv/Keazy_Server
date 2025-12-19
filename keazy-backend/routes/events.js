const express = require('express');
const Joi = require('joi');
const Event = require('../models/event');

const router = express.Router();

const schema = Joi.object({
  type: Joi.string().valid('query', 'view', 'book', 'cancel', 'complete', 'rating').required(),
  user_id: Joi.string().optional(),
  provider_id: Joi.string().optional(),
  job_id: Joi.string().optional(),
  metadata: Joi.object().optional()
});

router.post('/', async (req, res, next) => {
  try {
    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const ev = await Event.create(value);
    res.status(201).json({ ok: true, id: ev._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
