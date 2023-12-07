import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Dialog } from '@reach/dialog';
import { weights } from './weights';
import { useState } from 'react';

const weightValues = Object.values(weights);
const easyCountries = weightValues.filter((weight) => weight >= 0.8).length;
const mediumCountries = weightValues.filter((weight) => weight >= 0.5).length;
const hardCountries = weightValues.filter((weight) => weight >= 0.3).length;
const veryHardCountries = weightValues.length;

export const IntroModal = NiceModal.create(({ onStart }) => {
  const modal = useModal();

  function startGame(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    onStart(data.get('difficulty'));
    modal.hide();
  }

  return (
    <Dialog isOpen={modal.visible} onDismiss={modal.hide}>
      <form className="modal modal--intro" onSubmit={startGame}>
        <h1>Country Guesser</h1>
        <h2>How to play</h2>
        <p>Type the name of the country highlighted.</p>
        <h2>Select difficulty</h2>
        <label>
          <input type="radio" name="difficulty" value="easy" /> American (
          {easyCountries} countries)
        </label>
        <label>
          <input type="radio" name="difficulty" value="medium" /> Tourist (
          {mediumCountries} countries)
        </label>
        <label>
          <input type="radio" name="difficulty" value="hard" defaultChecked />{' '}
          GeoGuessr enjoyer ({hardCountries} countries)
        </label>
        <label>
          <input type="radio" name="difficulty" value="veryHard" /> Ultra
          violence ({veryHardCountries} countries)
        </label>
        <button type="submit">Start</button>
      </form>
    </Dialog>
  );
});
