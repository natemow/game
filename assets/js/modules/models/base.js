
import { Game } from '../game.js';
import { Point } from '../geometry.js';
import { Utility } from '../utility.js';

export class Base {

  static snapToValue = 20;
  static minFast = 4;
  static maxHealth = 10;

  /**
   * Module base.
   *
   * @public
   * @method constructor
   * @param { Element } element The current object avatar element.
   */
  constructor(element) {

    // Set element.
    this.element = (element || false);

    // Set data.
    this.data = {
      expired: false
    };

  }

  /**
   * Joins object to game.
   *
   * @public
   * @method join
   * @param { Game } game The game to add object to.
   * @param { Object } attributes The custom attributes to apply to object avatar.
   * @param { Object } properties The custom properties to apply to object avatar.
   * @returns { Base } Returns the object joined to game.
   */
  join(game, attributes, properties) {

    const type = this.constructor.name.toLowerCase(),
          point = new Point(
            Utility.getRandom(0, game.config.map.bounds.x),
            Utility.getRandom(0, game.config.map.bounds.y)
          );

    if (this.element.hasAttribute('id')) {
      // Update style.
      this.element = Utility.setElementAttributes(this.element, {
        id: this.element.id,
        class: this.element.getAttribute('class'),
        style: `left: ${point.x}px; top: ${point.y}px;`
      });

    } else {
      // Set game.
      this.game = game;

      // Set element id.
      const id = Utility.getUUID();

      // Set element.
      this.element = Utility
        .setElementAttributes(this.element, {
          id,
          class: `obj -${type}`,
          style: `left: ${point.x}px; top: ${point.y}px;`
        });

      if (attributes) {
        /**
         * Classes must be applied prior to the recursive move() + join() check
         * below so this.element.offsetWidth + Height resolves correctly...otherwise
         * element overlap occurs.
         */
        if (attributes.class) {
          this.element.setAttribute('class', `${this.element.getAttribute('class')} ${attributes.class}`);
        }
      }

      // Add element to map.
      this.game.config.map.element
        .append(this.element);

      // Store element.
      this.game.elements[this.element.id] = this;


      // Set element label.
      const existing = Utility.document.getElementsByClassName(`-${type}`);
      let label = `${type} ${(existing.length === 0 ? 1 : existing.length)}`;
      if (properties && properties.label) {
        label = properties.label;
      }
      this.element.setAttribute('title', label);
      this.element.innerHTML = `<span class="label">${label}</span>`;

    }


    // "Move" element until randomly generated points resolve to unoccupied map location.
    while (!this.move({ direction: false })) {
      this.join(this.game, attributes, properties);
    }

    return this;
  }

  /**
   * Removes object from game.
   *
   * @protected
   * @method expire
   */
  expire() {

    if (typeof this.moveRandomInterval !== 'undefined') {
      clearInterval(this.moveRandomInterval);
    }

    Utility.fadeOut(this.element, () => {
      delete this.game.elements[this.element.id];

      this.element.remove();
      this.data.expired = true;
    });

    Utility.debug(`${this.element.title} expired`);

  }



  /**
   * Utility function for wrapping movement.
   *
   * @private
   * @method moveWrapParams
   * @param { string } axis The axis.
   * @param { number } value The X/Y value.
   * @param { callback } callback The callback function.
   */
  moveWrapParams(axis, value, callback) {

    let offset = false,
        boundary = false;

    if (axis === 'x') {
      offset = this.element.offsetWidth;
      boundary = this.game.config.map.bounds.x;
    } else if (axis === 'y') {
      offset = this.element.offsetHeight;
      boundary = this.game.config.map.bounds.y;
    }

    if (offset && boundary && (typeof callback === 'function')) {
      return callback(offset, boundary);
    }

    return false;
  }

  /**
   * Allow movement wrapping across map bounds.
   *
   * @private
   * @method moveWrap
   * @param { string } axis The axis.
   * @param { number } value The X/Y value.
   */
  moveWrap(axis, value) {

    this.moveWrapParams(axis, value, (offset, threshold) => {
      if ((value + offset) > (threshold + offset)) {
        value = 0;
      } else if ((value + offset) <= 0) {
        value = threshold;
      }
    });

    return value;
  }

  /**
   * Disallow movement wrapping across map bounds.
   *
   * @private
   * @method moveNoWrap
   * @param { string } axis The axis.
   * @param { number } value The X/Y value.
   */
  moveNoWrap(axis, value) {

    this.moveWrapParams(axis, value,(offset, threshold) => {
      if (value < 0) {
        value = 0;
      } else if (value >= (threshold - offset)) {
        value = (threshold - offset);
      }
    });

    return value;
  }

  /**
   * Move element on the map.
   *
   * Movement can trigger interact() between objects.
   *
   * @protected
   * @method move
   * @param { Object } params The motion parameters.
   * @returns { boolean } Success/failure of the movement.
   */
  move(params) {

    const geometry = Utility.getGeometry(this.element);

    // Get global or element snapTo.
    let snapTo = this.game.config.map.snapTo;
    if (this.data.snapTo === true) {
      snapTo = Base.snapToValue;
    }

    // Set standard or fast(er) speed.
    let offset = 1;
    if (params.fast === true) {
      offset = (Number.isInteger(this.data.fast) ? this.data.fast : Base.minFast);
    }

    let left = geometry.points.left,
        top = geometry.points.top;

    switch (params.direction) {
      case 'left':  left  -= offset; break;
      case 'right': left  += offset; break;
      case 'up':    top   -= offset; break;
      case 'down':  top   += offset; break;
    }

    // Snap-to nearest configured integer.
    if (snapTo !== false) {
      left = (Math.round(left / snapTo) * snapTo);
      top = (Math.round(top / snapTo) * snapTo);
    }


    if (this.game.config.map.wrap === true) {
      // Wrap X/Y movement.
      left = this.moveWrap('x', left);
      top = this.moveWrap('y', top);

    } else {
      // Nowrap X/Y movement.
      const leftNew = this.moveNoWrap('x', left),
            topNew = this.moveNoWrap('y', top);

      // Return false if object has hit a boundary.
      if (left !== leftNew || top !== topNew) {
        return false;
      }

      left = leftNew;
      top = topNew;
    }


    // Verify the updated points don't conflict with an existing map object.
    const blocker = Utility.getMovementBlocker(this.game, this.element, {
      left,
      top,
      right: (left + this.element.offsetWidth),
      bottom: (top + this.element.offsetHeight)
    });

    if (blocker === false) {
      // Update element coordinates.
      this.element.setAttribute('style', `left: ${left}px; top: ${top}px;`);
      return true;

    } else {
      // Trigger interaction between objects.
      if (typeof this.interact === 'function' && typeof blocker.interact === 'function') {
        this.interact(blocker);
      }

    }

    return false;
  }

  /**
   * Move element on the map randomly.
   *
   * @public
   * @method moveRandom
   * @param { boolean } fast Force fast movement.
   */
  moveRandom(fast) {

    // Clear any previous interval.
    if (typeof this.moveRandomInterval !== 'undefined') {
      clearInterval(this.moveRandomInterval);
    }

    // Exit if expired or key map doesn't exist.
    if (this.data.expired || typeof this.keydownMap === 'undefined') {
      return false;
    }
    // Exit if winner exists.
    const winner = this.isWinner();
    if (winner !== false && typeof this.moveRandomInterval !== 'undefined') {
      return false;
    }


    // Set threshold and random key(s).
    const threshold = Utility.getRandom(1, 100),
          movements = this.game.getActions('movement'),
          combo = Utility.getRandomKey(movements),
          combos = Array.isArray(movements[combo]) ? movements[combo] : [combo];

    fast = (fast || (threshold % 2 === 0));

    this.keydownMap = {};
    for (let i in combos) {
      this.keydownMap[combos[i]] = true;
    }

    /**
     * Move player in a continuous direction {threshold} times.
     *
     * Repeat interval at approximate length of time it might take a user to press and hold an arrow key.
     */
    let count = 0;
    this.moveRandomInterval = setInterval(() => {
      count++;

      let result = true,
          direction = false;
      for (let key in this.keydownMap) {
        direction = Utility.getDirection(key);

        result = result && this.move({ direction, fast });
      }

      // Player can't move, change direction.
      if (!result) {
        count = threshold;
      }
      // Move recursively.
      if (count === threshold) {
        this.moveRandom();
      }
    }, 30);

    // Utility.debug(`new interval ${this.moveRandomInterval} for ${this.element.title}`);

    return true;
  }

}
