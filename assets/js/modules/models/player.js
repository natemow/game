
import { Utility } from '../utility.js';
import { Base } from './base.js';

export class Player extends Base {

  /**
   * Initialize the Player.
   */
  constructor() {

    // Build element.
    const element = Utility.createElement('div', false, false);

    // Initialize base.
    super(element);

    // Set player keydown logger.
    this.keydownMap = {};
    // Set player health.
    this.health = 10;
    // Set player automaton status.
    this.automaton = false;

    // Set player controls.
    const events = ['keydown', 'keyup'];
    for (let index in events) {
      Utility.document.addEventListener(events[index], (e) => {
        this.play(e);
      });
    }

    return this;
  }

  /**
   * The main play method.
   *
   * @public
   * @method play
   * @param { KeyboardEvent } e The keyboard event.
   * @returns { boolean } The result.
   */
  play(e) {

    // Log player instance keydown.
    if (e.type === 'keydown') {
      this.keydownMap[e.code] = true;
    } else if (e.type === 'keyup') {
      delete this.keydownMap[e.code];
    }

    // Check for configured action.
    let action = this.game.config.actions[e.code];

    // Toggle Player property.
    if (typeof this[action] !== 'function') {
      // this[action] = !this[action];
      return false;
    }

    // Valid action, prevent event default.
    e.preventDefault();

    if (action === 'move') {
      // Player move action.
      // Note: the keydownMap loop is how support for diagonal motion happens.
      let result = true;
      for (let code in this.keydownMap) {
        const movement = {
                direction: Utility.getDirection(code),
                fast: e.shiftKey
              };

        if (movement.direction) {
          result = result && this[action](movement);
        }
      }

      return result;

    } else {
      // Player N action.
      return this[action]();

    }

  }

  /**
   * Callback fired when player interacts with another interactive object.
   *
   * @protected
   * @method interact
   * @param { Base } target The object being interacted with.
   */
  interact(target) {

    let message = `${target.element.title}`;

    // Attack!
    target.health -= 1;
    if (target.health > 0) {
      message += ` attacked by ${this.element.title}!`;

      // Automatons get a chance to run away randomly.
      if (target.automaton === true) {
        target.moveRandom();
      }

    } else {
      // Kill!
      target.expire();
      message += ` killed by ${this.element.title}!`;
    }

    this.game.setScoreboard(message);

  }

  /**
   * Check if player is game winner.
   *
   * @public
   * @method isWinner
   * @returns { boolean }
   */
  isWinner() {

    if (this.expired) {
      return false;
    }

    const players = this.game.getPlayers(),
          identifiers = Object.keys(players);

    if (identifiers.length === 1 && identifiers[0] === this.element.id) {
      return true;
    }

    return false;
  }

}
