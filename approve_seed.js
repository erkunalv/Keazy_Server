db.queries.updateMany({}, {$set: {approved_for_training: true}});
db.queries.aggregate([{$group: {_id: '$normalized_service', count: {$sum: 1}}}]).forEach(d => print(d._id + ': ' + d.count));
