const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, default: '' },
    originalName: { type: String, default: '' },
    storagePath: { type: String, default: '' },
    size: { type: Number, default: 0 },
    mime: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploaderName: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FileRec', fileSchema);
