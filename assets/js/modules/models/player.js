
import { Utility } from '../utility.js';
import { Base } from './base.js';

export class Player extends Base {

  /**
   * @inheritdoc
   */
  constructor(game, attributes, properties) {

    super(game, attributes, properties);

    // Set data.
    this.data = {
      ...this.data,
      snapTo: false,
      health: Base.maxHealth,
      fast: 4
    }

    // Set player keydown logger.
    this.keydownMap = {};

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
   * The main play method for non-automaton players.
   *
   * @public
   * @method play
   * @param { KeyboardEvent } e The keyboard event.
   * @returns { boolean } The result.
   */
  play(e) {

    // Automatons can't respond to keyboard events.
    if (this.constructor.name === 'Automaton') {
      return false;
    }

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
   * @public
   * @method interact
   * @param { Base } target The object being interacted with.
   */
  interact(target) {

    let message = false;

    switch (target.constructor.name) {
      case 'Player':
      case 'Automaton':
        message = `${target.element.title} `
          + ((target.data.health - 1) > 0 ?
            `attacked by ${this.element.title}!` :
            `killed by ${this.element.title}!`
          );

        // Attack!
        target.data.health -= 1;

        Utility.toggleClass(target.element, '-negative', 250);

        if (target.data.health === 0) {
          // Kill!
          target.expire();

        } else {
          // Run away!
          if (target.constructor.name === 'Automaton') {
            target.moveRandom(true);
          }

        }
        break;

      case 'Fast':
        // Increment fast.
        this.data.fast += target.data.fast;

        Utility.toggleClass(this.element, '-positive', 250);

        message = `${this.element.title} (+${(this.data.fast - Base.minFast)}) fast mode!`;

        target.expire();
        break;

      case 'Health':
        message = `${this.element.title} (+${target.data.health}) health!`;

        // Increment health.
        this.data.health += target.data.health;

        Utility.toggleClass(this.element, '-positive', 250);

        target.expire();
        break;

      case 'Mine':
        message = `${this.element.title} (-${target.data.health}) mine damage!`;

        // Decrement health.
        this.data.health -= target.data.health;
        target.expire();

        Utility.toggleClass(this.element, '-negative', 250);

        if (this.data.health <= 0) {
          message = `${this.element.title} killed by a mine!`;

          this.expire();
        }
        break;
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

    if (this.data.expired || this.data.health <= 0) {
      return false;
    }

    const players = this.game.getPlayers(),
          keys = Object.keys(players);

    if (keys.length === 1 && keys[0] === this.element.id) {
      return true;
    }

    return false;
  }

}
