import './App.css';
import { useLayoutEffect, useState, useCallback } from 'react';
import * as topojson from 'topojson-client';
import world from '../countrymasks.json';
import { useWindowSize } from '@uidotdev/usehooks';
import NiceModal from '@ebay/nice-modal-react';
import { IntroModal } from './IntroModal';
import { Globe } from './Globe';
import { geoCentroid } from 'd3-geo';
import { GuessInput } from './GuessInput';
import { weightedShuffle, weights } from './weights';
import { Timer } from './Timer';

export const land = topojson.feature(world, world.objects.countrymasks);
const countriesArray = land.features;

const sortedCountries = weightedShuffle(Object.entries(weights));

const countries = sortedCountries.map(([countryCode]) => {
  return countriesArray.find((item) => item.properties.isocode === countryCode);
});

const initialRotation = geoCentroid(countries[0]);

const numCountries = sortedCountries.length;

export default function App() {
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [countryIndex, setCountryIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState<string | null>(null);
  const [showGameOver, setShowGameOver] = useState<boolean | null>(null);
  const [rotation, setRotation] = useState([
    -initialRotation[0],
    -initialRotation[1],
  ]);
  const size = useWindowSize();
  const country = countries[countryIndex];

  const updateSelectedCountry = useCallback(() => {
    if (countryIndex + 1 < numCountries) {
      const newIndex = countryIndex + 1;
      setCountryIndex(newIndex);
      const newRotation = geoCentroid(countries[newIndex]);
      setRotation([-newRotation[0], -newRotation[1]]);
    } else {
      setShowGameOver(true);
    }
  }, [countryIndex]);

  function setNewCountry() {
    setShowAnswer(null);
    updateSelectedCountry();
  }

  function handleSubmit(term: string) {
    if (term.toLowerCase() === country.properties.NAME.toLowerCase()) {
      setShowAnswer('correct');
      setCorrectGuesses((total) => total + 1);
      setStreak((total) => total + 1);
    } else {
      setShowAnswer('incorrect');
      setIncorrectGuesses((total) => total + 1);
      setStreak(0);
    }
  }

  function onStart() {
    setShowGameOver(false);
  }

  useLayoutEffect(() => {
    NiceModal.show(IntroModal, { onStart });
  }, []);

  return (
    <div className="wrapper">
      <Globe
        country={country}
        size={size}
        initialRotation={initialRotation}
        rotation={rotation}
      />
      <div className="ui">
        <div>
          Round: {countryIndex + 1}/{numCountries}
        </div>
        <div>
          <Timer gameRunning={showGameOver === false} />
        </div>
        <div>Streak: {streak}</div>
        <div>Correct: {correctGuesses}</div>
        <div>Incorrect: {incorrectGuesses}</div>
      </div>
      <div className="overlay">
        {showGameOver ? (
          <div>GameOver</div>
        ) : showAnswer ? (
          <>
            {showAnswer === 'correct' ? (
              <div className="font-effect-outline correct">Correct!</div>
            ) : (
              <div className="font-effect-outline incorrect">Incorrect.</div>
            )}
            <div className="country-name font-effect-outline">
              {country.properties.NAME}
            </div>
            <button autoFocus type="button" onClick={setNewCountry}>
              Next
            </button>
          </>
        ) : (
          <GuessInput onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
