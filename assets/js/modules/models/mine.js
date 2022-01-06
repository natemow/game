
import { Utility } from '../utility.js';
import { Base } from './base.js';

export class Mine extends Base {

  /**
   * @inheritdoc
   */
  constructor(game, attributes, properties) {

    super(game, attributes, properties);

    // Set data.
    this.data = {
      ...this.data,
      health: Utility.getRandom(1, 10)
    }

    return this;
  }

}
