# Quick Reference - Retrain & Correction Workflows

## 🎯 User Workflows

### Workflow 1: Mark a Prediction as Wrong & Correct It

1. Navigate to **Dashboard → Query Logs**
2. Find a query with wrong prediction
3. Click the **✗ Wrong** button
4. **Select correct service** from dropdown
5. Click **Save Correction**
6. Correction saved to MongoDB ✅

### Workflow 2: Trigger Model Retrain

1. Navigate to **Dashboard → 🤖 Model Retrain**
2. Click **Trigger Retrain** button
3. Confirm in dialog
4. System automatically:
   - Fetches approved logs
   - Fetches user corrections
   - Merges datasets
   - Trains new model
   - Saves artifacts
5. See success notification ✅

### Workflow 3: Monitor Retrain History

1. Go to **Model Retrain** page
2. View history table:
   - **Timestamp** - When retrain occurred
   - **Sample Count** - Total training samples
   - **Logs Used** - Breakdown of approved vs corrections
   - **Status** - Success/Failed/Pending
   - **ML Response** - Training details

---

## 🔧 Developer Reference

### New Backend Endpoints

**Save Correction:**
```http
POST /dashboard/corrections
Content-Type: application/json

{
  "query_id": "507f1f77bcf86cd799439011",
  "query_text": "cancel my reservation",
  "original_service": "booking",
  "corrected_service": "cancellation",
  "confidence": 0.72,
  "timestamp": "2026-01-02T10:30:00Z"
}

Response: { success: true, correction_id: "..." }
```

**Fetch Corrections:**
```http
GET /dashboard/corrections

Response: [
  {
    query_id: "507f1f77bcf86cd799439011",
    query_text: "cancel my reservation",
    original_service: "booking",
    corrected_service: "cancellation",
    ...
  },
  ...
]
```

### New Frontend Components

**RetrainPage.jsx:**
- Location: `keazy-admin/src/pages/RetrainPage.jsx`
- Routes to: `/retrain`
- Menu: "🤖 Model Retrain"
- Features: Trigger button, history table, notifications

**QueryLogsPage.jsx Updates:**
- Added Mark Correct/Wrong buttons
- Added correction dialog
- Added correction status column
- Full error handling with toasts

### New ML Integration

**train_model.py Changes:**
```python
# Fetch approved logs
docs = list(query_logs_col.find({"approved_for_training": True}, ...))

# Fetch corrections
corrections = list(corrections_col.find({}, ...))

# Transform corrections to training format
corrections_docs = [
    {
        "query_text": c["query_text"],
        "assigned_service": c["corrected_service"],
        "urgency": "normal"
    }
    for c in corrections
]

# Merge and train
docs.extend(corrections_docs)
df = pd.DataFrame(docs)
# ... rest of training
```

---

## 📊 Database Schema

### corrections Collection
```javascript
{
  _id: ObjectId,
  query_id: String,           // Link to query_logs
  query_text: String,         // Original query
  original_service: String,   // Wrong prediction
  corrected_service: String,  // Correct service
  confidence: Number,         // Model confidence
  timestamp: Date,            // When correction made
  created_at: Date,           // Auto-created
  updated_at: Date            // Auto-updated
}
```

### query_logs Collection Updates
```javascript
{
  _id: ObjectId,
  query_text: String,
  normalized_service: String,
  assigned_service: String,
  corrected_service: String,  // ← NEW: Set by correction
  corrected_at: Date,         // ← NEW: When corrected
  ...
}
```

---

## 🧪 Testing

### Run Corrections Integration Test
```bash
cd d:\Business\KeySystech\Project_3
python test_corrections_logic.py
```

### Expected Output
```
✅ Found 3 approved logs
✅ Found 2 corrections
✅ Transformed 2 corrections
✅ Total training documents: 5
✅ Model trained on 5 samples
✅ All tests passed!
```

---

## 🚨 Common Issues & Solutions

### Issue: Correction not saving
**Solution:** Check `/dashboard/corrections` endpoint is deployed

### Issue: Corrections not in retrain
**Solution:** Verify `corrections_col.find()` in train_model.py is running

### Issue: RetrainPage not showing
**Solution:** Ensure route `/retrain` added to App.jsx

### Issue: Service dropdown empty in dialog
**Solution:** Check `useServices` hook is fetching from `/services`

---

## 📈 Metrics to Track

### Model Improvement Metrics
- Total corrections submitted
- Corrections per service (find problem areas)
- Model accuracy before/after retrain
- Most corrected service (focus training)

### Usage Metrics
- Retrain frequency
- Approved vs corrected logs ratio
- User engagement with Mark Correct/Wrong buttons
- Correction acceptance rate

---

## 🔐 Security Notes

All endpoints use `adminAuth` middleware:
```javascript
router.post("/corrections", adminAuth, async (req, res) => {
  // Only authenticated admins can save corrections
});
```

Ensure MongoDB `corrections` collection:
- ✅ Has proper indexes
- ✅ Has size limits if needed
- ✅ Has backup strategy
- ✅ Has access controls

---

## 📚 Related Files

| Purpose | File | Status |
|---------|------|--------|
| Query Correction UI | `keazy-admin/src/pages/QueryLogsPage.jsx` | ✅ Updated |
| Retrain Dashboard | `keazy-admin/src/pages/RetrainPage.jsx` | ✅ NEW |
| Backend Endpoints | `keazy-backend/routes/dashboard.js` | ✅ Updated |
| ML Pipeline | `ml-service/train_model.py` | ✅ Updated |
| Routing | `keazy-admin/src/App.jsx` | ✅ Updated |
| Navigation | `keazy-admin/src/components/DashboardLayout.jsx` | ✅ Updated |
| Testing | `test_corrections_logic.py` | ✅ NEW |
| Documentation | `RETRAIN_CORRECTIONS_IMPLEMENTATION.md` | ✅ NEW |

---

## 💡 Pro Tips

1. **Efficient Corrections**: Mark multiple similar predictions wrong, then retrain once
2. **Monitor Services**: Track which services get corrected most
3. **Retrain Frequency**: Retrain after accumulating 10-20 corrections
4. **Validation**: Always check corrected service makes sense
5. **Feedback**: Use correction data to improve initial predictions

---

## 🎓 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  QueryLogsPage (✗ Wrong, Correct Dialog)              │
│  RetrainPage (Trigger, History Table)                  │
│  DashboardLayout (Menu Items)                          │
└──────────────────┬──────────────────────────────────────┘
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Express.js)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  POST /dashboard/corrections ←─ Saves corrections       │
│  GET /dashboard/corrections ←─ Fetches for retraining   │
│  POST /dashboard/retrain ←─ Triggers retrain            │
│  GET /dashboard/retrain/history ←─ Shows history        │
└──────────────────┬──────────────────────────────────────┘
                   │ Read/Write
                   ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (MongoDB)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  query_logs (approved for training)                    │
│  corrections (user-corrected predictions) ← NEW         │
│  retrain_history (retrain metadata)                    │
└─────────────────────────────────────────────────────────┘
                   │ Fetch/Merge
                   ▼
┌─────────────────────────────────────────────────────────┐
│           ML PIPELINE (Python Flask)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  train_model.py (NEW: Fetch corrections)               │
│  ├─ Fetch approved_for_training logs                   │
│  ├─ Fetch corrections from corrections_col             │
│  ├─ Merge into single dataset                          │
│  ├─ Train on combined data                             │
│  └─ Save model artifacts                               │
└─────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0  
**Last Updated:** January 2, 2026  
**Status:** ✅ Production Ready
