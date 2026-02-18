class Fitrep {
  constructor() {
    this.name = null;
    this.grade = null;
    this.desig = null;
    this.ssn = null;
    this.dutyStatus = null;
    this.uic = null;
    this.station = null;
    this.promo = null;
    this.dateRep = null;
    this.occasion = null;
    this.fromPeriod = null;
    this.toPeriod = null;
    this.notObserved = null;
  }

  // Generic setter to handle any field
  setField(field, value) {
    if (Object.prototype.hasOwnProperty.call(this, field)) {
      this[field] = value;
    }
  }

  // Returns data for database insertion
  toObject() {
    return { ...this };
  }

  // Reset for a new report
  clear() {
    Object.keys(this).forEach(key => this[key] = null);
  }
}

module.exports = Fitrep;