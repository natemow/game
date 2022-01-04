
import { Utility } from '../utility.js';
import { Player } from './player.js';

export class Automaton extends Player {

  /**
   * Initialize the Automaton.
   */
  constructor() {

    // Build element.
    const element = Utility.createElement('div', false, false);

    // Initialize base.
    super(element);

    return this;
  }

}