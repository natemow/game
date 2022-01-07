
import config from '../config.js';
import { Utility } from './utility.js';
import { Point } from './geometry.js';
import { Base } from './models/base.js';
import { Block } from './models/block.js';
import { Fast } from './models/fast.js';
import { Health } from './models/health.js';
import { Mine } from './models/mine.js';
import { Automaton } from './models/automaton.js';

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

    const map = Utility.document.getElementById('map');

    // Set map config.
    config.map = {
      ...config.map,
      bounds: new Point(map.offsetWidth, map.offsetHeight),
      element: map
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
          map = Utility.createElement('article', { id: 'map' }, false),
          sidebar = Utility.createElement('aside', false, false),
          header = Utility.createElement('header', false, false),
          footer = Utility.createElement('footer', false, false);

    // Set game containers.
    element.append(header);
    element.append(main);
    element.append(footer);
    main.append(map);
    main.append(sidebar);

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

    const buildHelp = (group, collection, element) => {

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

      element.append(nav);
    }

    const scoreboard = Utility.createElement('div', { id: 'scoreboard' }, false),
          controls = Utility.createElement('div', { id: 'controls' }, false);

    buildHelp('others', others, controls);
    buildHelp('arrows', arrows, controls);

    sidebar.append(scoreboard);
    sidebar.append(controls);

    this.populate();

  }

  /**
   * Populate the game with objects.
   *
   * @private
   * @method populate
   */
  populate() {

    const map = Utility.document.getElementById('map'),
          range = Utility.getRange(10),
          winner = this.getWinner();

    // Clear map by type.
    const remove = (type) => {
      const existing = Utility.document.querySelectorAll(`[data-type="${type}"]`);

      if (existing) {
        for (let i = 0; i < existing.length; i++) {
          this.remove(existing[i]);
        }
      }
    }

    // Set some random blocks.
    remove('block');
    for (let i in range) {
      const size = Utility.getRandomFromArray(['', '-l', '-xl', '-xxl']);

      new Block(this, { class: size }, false)
        .join();
    }

    // Set some random fasts.
    remove('fast');
    for (let i in Utility.getRange(4)) {
      new Fast(this)
        .join();
    }

    // Set some random healths.
    remove('health');
    for (let i in range) {
      new Health(this)
        .join();
    }

    // Set some random mines.
    remove('mine');
    for (let i in range) {
      new Mine(this)
        .join();
    }

    // Set some random automatons.
    remove('automaton');
    for (let i in range) {
      const automaton = new Automaton(this, false, { title: `zombie ${(parseInt(i) + 1)}` })
        .join();

      automaton.moveRandom();
    }

  }

  /**
   * Remove element from game.
   *
   * @private
   * @method remove
   * @param { Element } element The element to remove.
   */
  remove(element) {

    if (element.id) {
      for (let key in this.elements) {
        delete this.elements[key][element.id];
      }
      delete this.elements[element.id];

      const score = Utility.document.getElementById(`stats-${element.id}`);
      if (score) {
        score.remove();
      }
    }

    element.remove();

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
      return (value.constructor.name === 'Player' || value.constructor.name === 'Automaton');
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
    for (let key in players) {
      if (players[key].isWinner()) {
        winner = players[key];
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
          lastMessage = (board.firstElementChild ? board.firstElementChild.innerHTML : ''),
          players = this.getPlayers(),
          winner = this.getWinner();

    // Winner!
    if (winner !== false) {
      // Clear board.
      while (board.firstElementChild) {
        board.firstElementChild.remove();
      }

      // Repopulate game.
      this.populate();

      // Level-up winner and rejoin.
      winner.levelUp();
      winner.join();

      return;
    }


    // Build board.
    let announce = board.querySelector('.message');
    if (!announce) {
      announce = Utility.createElement('div', { class: 'message' }, false);

      board.append(announce);
    }

    for (let key in players) {
      const id = `stats-${players[key].element.id}`;
      let stats = document.getElementById(id);

      if (!stats) {
        stats = Utility.createElement('div', { id }, {
          innerHTML: `
            <div class="title">${players[key].element.title}</div>
            <div class="fast"></div>
            <div class="health"></div>`
        });

        board.append(stats);
      }
    }


    // Print message.
    announce.innerHTML = (message !== false ? message : lastMessage);

    // Print stats.
    if (!winner) {
      for (let key in players) {
        const fast = (players[key].data.fast - Base.minFast),
              stats = Utility.document.getElementById(`stats-${players[key].element.id}`);

        if (stats) {
          stats.querySelector('.title').innerHTML = players[key].element.title;
          stats.querySelector('.fast').innerHTML = (fast >= 1 ? `+${fast} fast mode` : '');
          stats.querySelector('.health').innerHTML = players[key].data.health;
        }
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
