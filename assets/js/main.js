
import { Game } from './modules/game.js';
import { Player } from './modules/models/player.js';

((document) => {

  let game = false,
      player = false;

  const showConfigForm = false,
        configForm = document.getElementById('config'),
        config = {
          debug: false,
          map: {
            wrap: false,
            snapTo: false
          }
        };


  if (!showConfigForm) {
    game = new Game(document, config);
    player = new Player(game, false, false)
      .join();

    return;
  }


  configForm.setAttribute('style', 'display: block;');

  document.querySelector('#config input[type="submit"]')
    .addEventListener('click', (e) => {
      e.preventDefault();

      for (const [name, value] of new FormData(document.querySelector('#config form'))) {
        switch (name) {
          case 'debug':   config.debug = true; break;
          case 'wrap':    config.map.wrap = true; break;
          case 'snapTo':  config.map.snapTo = (value > 0 ? parseInt(value) : false); break;
        }
      }

      if (!game) {
        game = new Game(document, config);
      } else {
        game.setConfig(config);
      }

      if (!player) {
        player = new Player(game, false, false)
          .join();
      }

      configForm.setAttribute('style', 'display: none;');
    });

})(document);
