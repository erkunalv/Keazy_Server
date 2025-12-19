const express = require('express');
const Joi = require('joi');
const Job = require('../models/job');
const Provider = require('../models/provider');

const router = express.Router();

const createSchema = Joi.object({
  user_id: Joi.string().required(),
  provider_id: Joi.string().required(),
  service: Joi.string().required(),
  scheduled_time: Joi.date().optional(),
  notes: Joi.string().allow('').optional()
});

router.post('/', async (req, res, next) => {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const prov = await Provider.findOne({ provider_id: value.provider_id }).lean();
    if (!prov) return res.status(404).json({ error: 'Provider not found' });

    const job = await Job.create({
      job_id: `J${Date.now()}`,
      user_id: value.user_id,
      provider_id: value.provider_id,
      service: value.service.toLowerCase(),
      city: prov.city,
      area: prov.area,
      scheduled_time: value.scheduled_time || null,
      notes: value.notes || ''
    });

    res.status(201).json({ job_id: job.job_id, status: job.status });
  } catch (err) {
    next(err);
  }
});

router.patch('/:job_id', async (req, res, next) => {
  try {
    const { job_id } = req.params;
    const { status } = req.body;
    const job = await Job.findOneAndUpdate(
      { job_id },
      { status },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job_id: job.job_id, status: job.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
