
import { Utility } from '../utility.js';
import { Base } from './base.js';

export class Block extends Base {

  /**
   * Initialize the Block.
   */
  constructor() {

    // Build element.
    const element = Utility.createElement('div', false, false);

    // Initialize base.
    super(element);

    return this;
  }

}
