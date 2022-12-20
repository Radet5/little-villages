export interface LivingBeingStatus {
  sustanance: number;
  energy: number;
}

interface LivingBeingInterface {
  status: LivingBeingStatus;
}

export class LivingBeing implements LivingBeingInterface{
  private _status: LivingBeingStatus;

  constructor() {
    this._status = {
      sustanance: 1.0,
      energy: 1.0,
    }
  }

  get status() {return this._status;}

  get energy() {return this.status.energy;}
  set energy(amount: number) {this._status.energy = this.constrain(amount);}

  get sustanance() {return this.status.sustanance;}
  set sustanance(amount: number) {this._status.sustanance = this.constrain(amount);}

  private constrain(value: number, min = 0.0, max = 1.0) {
    if (value <= min) return min;
    else if (value >= max) return max;
    else return value;
  }
}