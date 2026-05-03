const { z } = require('zod');

const vitalsSchema = z.object({
    pulse: z.number().min(0).max(300).optional().nullable(),
    bp: z.object({
        systolic: z.number().min(0).max(300).optional().nullable(),
        diastolic: z.number().min(0).max(200).optional().nullable()
    }).refine(data => {
        const hasSys = data.systolic != null;
        const hasDia = data.diastolic != null;
        return hasSys === hasDia;
    }, {
        message: "Both systolic and diastolic pressures must be provided together."
    }).optional().nullable(),
    spO2: z.number().min(0).max(100).optional().nullable()
}).optional().nullable();

exports.validateVitals = (data) => {
    return vitalsSchema.parse(data);
};
