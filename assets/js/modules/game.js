
import config from '../config.js';
import { Utility } from './utility.js';
import { Point } from './geometry.js';
import { Block } from './models/block.js';
import { Health } from './models/health.js';
import { Player } from './models/player.js';

class GameSingleton {

  /**
   * Initialize the Game.
   *
   * @public
   * @method constructor
   * @param { Document } document The document object.
   * @param { Object } properties Config properties to override.
   */
  constructor(document, properties) {

    this.build(document, properties);

  }

  /**
   * Get the Game singleton.
   *
   * @static
   * @method getInstance
   * @param { Document } document The document object.
   * @param { Object } properties Config properties to override.
   */
  static getInstance(document, properties) {
    if (!GameSingleton.instance) {
      GameSingleton.instance = new GameSingleton(document, properties);
    }

    return GameSingleton.instance;
  }

  /**
   * Set game config.
   *
   * @public
   * @method setConfig
   * @param { Object } properties Config properties to override.
   */
  setConfig(properties) {

    const main = Utility.document.getElementsByTagName('main')[0];

    // Set map config.
    config.map = {
      ...config.map,
      bounds: new Point(main.offsetWidth, main.offsetHeight),
      element: main
    };

    if (properties.map) {
      for (let key in properties.map) {
        config.map[key] = properties.map[key];
      }
    }

    // Set game config.
    this.config = config;

    // Set debug mode.
    Utility.debugEnabled = (this.config.debug || properties.debug);
    Utility.debug(this.config);

  }

  /**
   * Build the game.
   *
   * @private
   * @method build
   * @param { Document } document The document object.
   * @param { Object } properties Config properties to override.
   */
  build(document, properties) {

    Utility.document = document;

    const element = Utility.document.getElementById('game'),
          main = Utility.createElement('main', false, false),
          header = Utility.createElement('header', false, false),
          footer = Utility.createElement('footer', false, false),
          scoreboard = Utility.createElement('aside', { id: 'scoreboard' }, false);

    // Set game containers.
    element.append(header);
    element.append(scoreboard);
    element.append(main);
    element.append(footer);

    // Set game config.
    this.setConfig(properties);

    // Set logger for elements added to the game.
    this.elements = {};



    // Set header.
    const title = Utility.createElement('h1', false, {
      innerText: this.config.header.title
    });
    header.append(title);


    // Set footer navigation/help.
    const others = [],
          arrows = [];

    for (let key in this.config.actions) {
      const direction = Utility.getDirection(key);
      if (direction) {
        arrows.push(key);
      } else {

        let print = true;
        if (Number.isInteger(this.config.map.snapTo) === true && key.indexOf('Shift') === 0) {
          print = false;
        }

        if (print) {
          others.push(key);
        }
      }
    }

    const buildFooterNav = (group, collection) => {

      const nav = Utility.createElement('nav', {
        class: group
      }, false);

      for (let index in collection) {
        const value = collection[index],
              direction = Utility.getDirection(value),
              title = (direction ? value.replace('Arrow', '') : value),
              className = (direction ? direction : value);

        const button = Utility.createElement('button', {
          class: className,
          title,
          'aria-keyshortcuts': value
        }, {
          innerText: (!direction ? value : '')
        });

        nav.append(button);
      }

      footer.append(nav);
    }

    buildFooterNav('others', others);
    buildFooterNav('arrows', arrows);



    // Set some random blocks.
    for (let index in Utility.getRange(10)) {
      const block = new Block(),
            size = Utility.getRandomFromArray(['', '-l', '-xl', '-xxl']);

      block
        .join(this, { class: size }, false);
    }

    // Set some random players.
    for (let index in Utility.getRange(10)) {
      const player = new Player();

      player
        .join(this, { class: '-auto' }, { label: `zombie ${(parseInt(index) + 1)}` })
        .moveRandom();
    }

    // Set some random health.
    for (let index in Utility.getRange(10)) {
      const health = new Health();

      health
        .join(this, {}, false);
    }

  }



  /**
   * Get game actions filtered by type.
   *
   * @static
   * @method getActions
   * @param { string } type The type of actions.
   * @returns { Object } The filtered actions.
   */
  getActions(type) {

    let filtered = {};

    switch (type) {
      case 'attack':
        filtered = Utility.getFilteredObject(this.config.actions, ([key, value]) => {
          return (key === 'Space');
        });
        break;

      case 'movement':
        filtered = Utility.getFilteredObject(this.config.actions, ([key, value]) => {
          return (key.indexOf('Arrow') === 0);
        });

        filtered = {
          ...filtered,
          ArrowUpRight: ['ArrowUp', 'ArrowRight'],
          ArrowUpLeft: ['ArrowUp', 'ArrowLeft'],
          ArrowDownRight: ['ArrowDown', 'ArrowRight'],
          ArrowDownLeft: ['ArrowDown', 'ArrowLeft']
        }
        break;
    }

    return filtered;
  }

  /**
   * Get game players.
   *
   * @public
   * @method getPlayers
   * @returns { Object } Returns all players.
   */
  getPlayers() {
    return Utility.getFilteredObject(this.elements, ([key, value]) => {
      return (value.constructor.name === 'Player');
    });
  }

  /**
   * Get game winner.
   *
   * @public
   * @method getWinner
   * @returns { boolean || Player } Returns winning player if exists, else false.
   */
  getWinner() {

    const players = this.getPlayers();

    let winner = false;
    for (let identifier in players) {
      if (players[identifier].isWinner()) {
        winner = players[identifier];
        break;
      }
    }

    return winner;
  }

  /**
   * Print the scoreboard.
   *
   * @public
   * @method setScoreboard
   * @param { string } message The header message to print.
   */
  setScoreboard(message) {

    const board = Utility.document.getElementById('scoreboard'),
          players = this.getPlayers(),
          winner = this.getWinner();

    // Clear board.
    board.setAttribute('style', 'display: block;');
    while (board.firstElementChild) {
      board.firstElementChild.remove();
    }

    // Winner!
    if (winner !== false) {
      message = `${winner.element.title} has won!`;
      winner.expire();
    }

    // Print latest message.
    if (message.length) {
      message = Utility.createElement('div', {}, {
        innerHTML: message
      });
      board.append(message);
    }

    // Print scores.
    if (!winner) {
      for (let key in players) {
        message = Utility.createElement('div', {}, {
          innerHTML: `<div>${players[key].element.title}</div><div>${players[key].data.health}</div>`
        });
        board.append(message);
      }
    }

  }

}

export class Game {

  /**
   * Initialize the Game.
   *
   * @public
   * @method constructor
   * @param { Document } document The document object.
   * @param { Object } properties Config properties to override.
   */
  constructor(document, properties) {
    return GameSingleton.getInstance(document, properties);
  }

}
