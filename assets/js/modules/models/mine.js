
import { Utility } from '../utility.js';
import { Base } from './base.js';

export class Mine extends Base {

  /**
   * Initialize the Mine.
   */
  constructor() {

    // Build element.
    const element = Utility.createElement('div', false, false);

    // Initialize base.
    super(element);

    // Set data.
    this.data = {
      ...this.data,
      snapTo: true,
      health: Utility.getRandom(1, Base.maxHealth)
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
