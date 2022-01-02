
import { Game } from '../game.js';
import { Point } from '../geometry.js';
import { Utility } from '../utility.js';

export class Base {

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
   * @param { Object } properties The custom properties to apply to object avatar.
   * @returns { Base } Returns the object joined to game.
   */
  join(game, properties) {

    // Set game.
    this.game = game;

    const id = Utility.getUUID(),
          type = this.constructor.name.toLowerCase(),
          point = new Point(
            Utility.getRandom(0, this.game.config.map.bounds.x),
            Utility.getRandom(0, this.game.config.map.bounds.y)
          );

    this.element = Utility.setElementAttributes(this.element, {
      id,
      class: `obj -${type}`,
      style: `left: ${point.x}px; top: ${point.y}px;`
    });

    this.game.config.map.element
      .append(this.element);


    /**
     * "Move" element until randomly generated points resolve to unoccupied map location.
     *
     * Note: instance added to map above will be replaced during this recursion.
     */
    while (this.move({ direction: null }) === false) {
      this.join(game, properties);
    }

    // Store element.
    this.game.elements[this.element.id] = this;

    // Set element label.
    const existing = Utility.document.getElementsByClassName(`-${type}`);
    let label = `${type} ${existing.length}`;
    if (properties && properties.label) {
      label = properties.label;
    }

    this.element = Utility.setElementAttributes(this.element, { title: label });
    this.element = Utility.setElementProperties(this.element, { innerHTML: `<span class="label">${label}</span>` });


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

    delete this.game.elements[this.element.id];
    this.element.remove();

    this.data.expired = true;

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

    const geometry = Utility.getGeometry(this.element),
          snapTo = this.game.config.map.snapTo,
          doSnapTo = Number.isInteger(snapTo);

    // Set fast or standard speed for non-snapTo config.
    let offset = (params.fast === true ? 4 : 1);

    // Fast mode doesn't apply to snapTo config.
    if (doSnapTo) {
      offset = snapTo;
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
    if (doSnapTo) {
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
    const pointsUpdated = {
      left,
      top,
      right: (left + this.element.offsetWidth),
      bottom: (top + this.element.offsetHeight)
    }

    // Check for blocking map object.
    const blocker = Utility.getMovementBlocker(this.game, this.element, pointsUpdated);
    if (blocker === false) {
      // Update element coordinates.
      this.element.setAttribute('style', `left: ${left}px; top: ${top}px;`);
      return true;
    }

    // Trigger interaction between objects.
    if (typeof this.interact === 'function' && typeof blocker.interact === 'function') {
      this.interact(blocker);
    }

    return false;
  }

  /**
   * Move element on the map randomly.
   *
   * @protected
   * @method moveRandom
   */
  moveRandom() {

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


    // Force keyup for current key map.
    for (let key in this.keydownMap) {
      this.play( new KeyboardEvent('keyup', { code: key }) );
    }

    // Automatons get a fighting chance to run away during this.interact().
    this.data.automaton = true;

    // Set threshold and random key(s).
    const threshold = Utility.getRandom(1, 100),
          movements = this.game.getActions('movement'),
          combo = Utility.getRandomKey(movements),
          combos = Array.isArray(movements[combo]) ? movements[combo] : [combo];

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

      let result = true;
      for (let key in this.keydownMap) {
        result = result && this.play( new KeyboardEvent('keydown', { code: key, shiftKey: (threshold % 2 === 0) }) );
      }

      // Player can't move, change direction.
      if (!result) {
        count = threshold;
      }
      // Move recursively.
      if (count === threshold) {
        this.moveRandom();
      }
    }, 60);

    Utility.debug(`new interval ${this.moveRandomInterval} for ${this.element.title}`);

    return true;
  }

}