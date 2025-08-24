const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedItem: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        itemType: {
            type: String,
            enum: ["post", "comment"],
            required: true,
        },
        reason: {
            type: String,
            enum: [
                "spam",
                "inappropriate",
                "harassment",
                "violence",
                "copyright",
                "fake_news",
                "other"
            ],
            required: true,
        },
        description: {
            type: String,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved", "dismissed"],
            default: "pending",
        },
        adminNotes: {
            type: String,
            maxlength: 1000,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        resolvedAt: {
            type: Date,
        },
        // Soft delete
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true, versionKey: false }
);

// Index cho tìm kiếm
ReportSchema.index({ itemType: 1, reportedItem: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporter: 1, createdAt: -1 });

const Report = mongoose.model("Report", ReportSchema);
module.exports = { Report };
