export function validateConfig(config) {
  const errors = [];

  if (config == null || typeof config !== 'object') {
    return { valid: false, errors: ['config must be an object'] };
  }

  if (!Array.isArray(config.teams)) {
    errors.push('teams must be an array');
  } else if (config.teams.length !== 3) {
    errors.push(`teams must have exactly 3 entries (got ${config.teams.length})`);
  } else {
    config.teams.forEach((team, i) => {
      if (!team || typeof team !== 'object') {
        errors.push(`teams[${i}] must be an object`);
        return;
      }
      if (typeof team.name !== 'string' || team.name.trim() === '') {
        errors.push(`teams[${i}].name must be a non-empty string`);
      }
      if (typeof team.color !== 'string' || team.color.trim() === '') {
        errors.push(`teams[${i}].color must be a non-empty string`);
      }
    });
  }

  if (!Array.isArray(config.categories)) {
    errors.push('categories must be an array');
  } else if (config.categories.length !== 5) {
    errors.push(`categories must have exactly 5 entries (got ${config.categories.length})`);
  } else {
    config.categories.forEach((cat, ci) => {
      if (!cat || typeof cat !== 'object') {
        errors.push(`categories[${ci}] must be an object`);
        return;
      }
      if (typeof cat.name !== 'string' || cat.name.trim() === '') {
        errors.push(`categories[${ci}].name must be a non-empty string`);
      }
      if (!Array.isArray(cat.questions)) {
        errors.push(`categories[${ci}].questions must be an array`);
        return;
      }
      if (cat.questions.length !== 6) {
        errors.push(`categories[${ci}].questions must have exactly 6 entries (got ${cat.questions.length})`);
      }
      cat.questions.forEach((q, qi) => {
        const prefix = `categories[${ci}].questions[${qi}]`;
        if (!q || typeof q !== 'object') {
          errors.push(`${prefix} must be an object`);
          return;
        }
        if (!Number.isInteger(q.points) || q.points < 0) {
          errors.push(`${prefix}.points must be a non-negative integer`);
        }
        if (typeof q.question !== 'string' || q.question.trim() === '') {
          errors.push(`${prefix}.question must be a non-empty string`);
        }
        if (!Array.isArray(q.options)) {
          errors.push(`${prefix}.options must be an array`);
        } else if (q.options.length < 3 || q.options.length > 5) {
          errors.push(`${prefix}.options must have 3 to 5 entries (got ${q.options.length})`);
        } else if (!q.options.every(o => typeof o === 'string' && o.trim() !== '')) {
          errors.push(`${prefix}.options must all be non-empty strings`);
        }
        if (!Number.isInteger(q.correctIndex)) {
          errors.push(`${prefix}.correctIndex must be an integer`);
        } else if (Array.isArray(q.options) && (q.correctIndex < 0 || q.correctIndex >= q.options.length)) {
          errors.push(`${prefix}.correctIndex is ${q.correctIndex} but options has ${q.options.length} entries`);
        }
      });
    });
  }

  return { valid: errors.length === 0, errors };
}
