const isEvaluationMode =
    String(process.env.EVALUATION_MODE).toLowerCase() === "true";

export default isEvaluationMode;