
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

    // Set data.
    this.data = {
      ...this.data,
      automaton: false,
      health: 10
    }

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

    switch (target.constructor.name) {
      case 'Player':
        const message = `${target.element.title} `
          + ((target.data.health - 1) > 0 ?
            `attacked by ${this.element.title}!` :
            `killed by ${this.element.title}!`
          );

        // Attack!
        target.data.health -= 1;

        if (target.data.health === 0) {
          // Kill!
          target.expire();
        } else {
          // Run away!
          if (target.data.automaton === true) {
            target.moveRandom();
          }
        }

        this.game.setScoreboard(message);
        break;

      case 'Health':
        // Absorb health.
        this.data.health += target.data.health;

        target.expire();
        break;
    }

  }

  /**
   * Check if player is game winner.
   *
   * @public
   * @method isWinner
   * @returns { boolean }
   */
  isWinner() {

    if (this.data.expired) {
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
