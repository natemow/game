
import { Utility } from '../utility.js';
import { Base } from './base.js';

export class Health extends Base {

  /**
   * Initialize the Health.
   */
  constructor() {

    // Build element.
    const element = Utility.createElement('div', false, false);

    // Initialize base.
    super(element);

    // Set data.
    this.data = {
      ...this.data,
      health: 1
    }

    return this;
  }

  /**
   * Dummy callback to support player interaction.
   *
   * @protected
   * @method interact
   * @param { Base } target The object being interacted with.
   */
  interact(target) { }

}
