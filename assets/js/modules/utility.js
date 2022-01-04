
import { Game } from './game.js';
import { Point, Geometry } from './geometry.js';

export class Utility {

  // Utility methods.
  /**
   * Print console message.
   *
   * @public
   * @method debug
   * @param { string } message The message to print.
   */
  static debug(message) {
    if (Utility.debugEnabled === true) {
      console.log(message);
    }
  }

  /**
   * Get a random, bounded integer.
   *
   * @static
   * @method getRandom
   * @param { number } min The lower boundary.
   * @param { number } max The upper boundary.
   */
  static getRandom(min, max) {

    min = Math.ceil(min);
    max = Math.floor(max);

    // The max is exclusive and the min is inclusive.
    return Math.floor(Math.random() * ((max - min) + min));
  }

  /**
   * Get a random key from object.
   *
   * @static
   * @method getRandomKey
   * @param { Object } obj The object.
   */
  static getRandomKey(obj) {
    var keys = Object.keys(obj);
    return keys[keys.length * Math.random() << 0];
  }

  /**
   * Get a random value from object.
   *
   * @static
   * @method getRandomValue
   * @param { Object } obj The object.
   */
  static getRandomValue(obj) {
    return obj[Utility.getRandomKey(obj)];
  }

  /**
   * Get a random value from array.
   *
   * @static
   * @method getRandomFromArray
   * @param { Array } arr The array.
   */
  static getRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Filter an object by callback.
   *
   * @static
   * @method getFilteredObject
   * @param { Object } obj The object to filter.
   * @param { function } callback The callback function.
   */
  static getFilteredObject(obj, callback) {
    return Object.fromEntries(
      Object
        .entries(obj)
        .filter(callback)
    );
  }

  /**
   * Get a range of numbers.
   *
   * @static
   * @method getRange
   * @param { number } max The upper boundary.
   */
  static getRange(max) {
    return [...Array(max).keys()];
  }

  /**
   * Gets a UUID.
   *
   * @static
   * @method getUUID
   */
  static getUUID() {
    return (Math.floor(Math.random() * Date.now()));
  }

  /**
   * Get the direction string per arrow key value.
   *
   * @static
   * @method getDirection
   * @param { string } code The keyboard code.
   */
  static getDirection(code) {

    if (code.indexOf('Arrow') === 0) {
      return code.replace('Arrow', '').toLowerCase();
    }

    return false;
  }


  // DOM methods.
  /**
   * The document object.
   *
   * @static
   * @property { Document } document
   */
  static document;

  /**
   * Create stub game element.
   *
   * @static
   * @method createElement
   * @param { string } tagName The element tag.
   * @param { Object } attributes The element attributes.
   * @param { Object } properties The element properties.
   */
  static createElement(tagName, attributes, properties) {

    let element = Utility.document.createElement(tagName);
    element = Utility.setElementAttributes(element, attributes);
    element = Utility.setElementProperties(element, properties);

    return element;
  }

  /**
   * Set element attributes.
   *
   * @static
   * @method setElementAttributes
   * @param { Element } element The element.
   * @param { Object } attributes The element attributes.
   */
  static setElementAttributes(element, attributes) {
    if (attributes) {
      for (let key in attributes) {
        element.setAttribute(key, attributes[key]);
      }
    }

    return element;
  }

  /**
   * Set element properties.
   *
   * @static
   * @method setElementProperties
   * @param { Element } element The element.
   * @param { Object } properties The element properties.
   */
  static setElementProperties(element, properties) {
    if (properties) {
      for (let key in properties) {
        element[key] = properties[key];
      }
    }

    return element;
  }

  /**
   * Toggle element class.
   *
   * @static
   * @method toggleClass
   * @param { Element } element The element.
   * @param { string } className The class name.
   * @param { number } timeout Remove the class after N ms.
   */
  static toggleClass(element, className, timeout) {

    element.classList.toggle(className);

    if (timeout && timeout > 0) {
      const timer = setTimeout(() => {
        element.classList.toggle(className);
        clearTimeout(timer);
      }, timeout);
    }

  }

  /**
   * Fade element out.
   *
   * @static
   * @method toggleClass
   * @param { Element } element The element.
   * @param { function } callback Callback after fade finishes.
   */
  static fadeOut(element, callback) {

    const interval = setInterval(function () {
      if (element.style.opacity > 0) {
        element.style.opacity -= 0.1;
      } else {
        clearInterval(interval);
        if (typeof callback === 'function') {
          callback();
        }
      }
    }, 10);

  }


  // Geometry methods.
  /**
   * Get point data from a game element.
   *
   * @static
   * @method getPoint
   * @param { Element } element The existing game element.
   */
  static getPoint(element) {

    const x = parseInt(element.style.left.replace('px', '')),
          y = parseInt(element.style.top.replace('px', ''));

    return new Point(x, y);
  }

  /**
   * Get point data from a game element.
   *
   * @static
   * @method getPointCenter
   * @param { Element } element The existing game element.
   */
  static getPointCenter(element) {

    const point = Utility.getPoint(element);
    point.x = point.x + (element.offsetWidth / 2);
    point.y = point.y + (element.offsetHeight / 2)

    return point;
  }

  /**
   * Get an array of points.
   *
   * @static
   * @method getPolygon
   * @param { Object } points The bounding points of the polygon.
   */
  static getPolygon(points) {
    return [
      new Point(points.left, points.top),
      new Point(points.right, points.top),
      new Point(points.right, points.bottom),
      new Point(points.left, points.bottom)
    ];
  }

  /**
   * Get geometry data from a game element.
   *
   * @static
   * @method getGeometry
   * @param { Element } element The existing game element.
   */
  static getGeometry(element) {

    const point = Utility.getPoint(element),
          left = point.x,
          top = point.y,
          right = (left + element.offsetWidth),
          bottom = (top + element.offsetHeight),
          points = { left, top, right, bottom },
          polygon = Utility.getPolygon(points);

    return {
      points,
      polygon
    };
  }

  /**
   * Check if an area is occupied on the game map.
   *
   * @static
   * @method getMovementBlocker
   * @param { Game } game The game to check.
   * @param { Element } element The element whose geometry will be updated.
   * @param { Object } points The geometry points to check.
   * @returns { boolean || Base } Returns blocking object if exists, else false.
   */
  static getMovementBlocker(game, element, points) {

    const calculator = new Geometry(),
          polygon = Utility.getPolygon(points);

    let blocker = false;

    // Loop all elements currently occupying area on the map.
    for (let id in game.elements) {
      if (element.id === id) {
        continue;
      }

      // Get comparison points for current element.
      const compare = game.elements[id],
            geometryCompare = Utility.getGeometry(compare.element);

      // Loop polygon points and check if each is inside geometryCompare.polygon.
      for (let p in polygon) {
        p = polygon[p];

        if (calculator.isInside(geometryCompare.polygon, geometryCompare.polygon.length, p)) {
          blocker = compare;
          break;
        }
      }

      // Exit element loop if overlap found.
      if (typeof blocker === 'object') {
        break;
      }
    }

    return blocker;
  }

}
