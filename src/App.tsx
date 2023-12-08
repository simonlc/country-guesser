import './App.css';
import { useLayoutEffect, useState, useCallback } from 'react';
import * as topojson from 'topojson-client';
import world from '../world-topo.json';
import { useWindowSize } from '@uidotdev/usehooks';
import NiceModal from '@ebay/nice-modal-react';
import { IntroModal } from './IntroModal';
import { Globe } from './Globe';
import { geoCentroid } from 'd3-geo';
import { GuessInput } from './GuessInput';
import { weightedShuffle, weights } from './weights';
import { Timer } from './Timer';

export const land = topojson.feature(world, world.objects.world);
const countriesArray = land.features;

const sortedCountries = weightedShuffle(Object.entries(weights));

const rawCountries = sortedCountries.map(([countryCode]) => {
  return countriesArray.find((item) => item.properties.isocode === countryCode);
});

const initialRotation = geoCentroid(rawCountries[0]);

const countriesByDifficulty = {
  easy: rawCountries.filter(
    (countryItem) => weights[countryItem.properties.isocode] >= 0.8,
  ),
  medium: rawCountries.filter(
    (countryItem) => weights[countryItem.properties.isocode] >= 0.5,
  ),
  hard: rawCountries.filter(
    (countryItem) => weights[countryItem.properties.isocode] >= 0.3,
  ),
  veryHard: [...rawCountries],
};

export default function App() {
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [countryIndex, setCountryIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState<string | null>(null);
  const [showGameOver, setShowGameOver] = useState<boolean | null>(null);
  const [countries, setCountries] = useState(countriesByDifficulty.hard);
  const [rotation, setRotation] = useState([
    -initialRotation[0],
    -initialRotation[1],
  ]);
  const size = useWindowSize();
  const country = countries[countryIndex];

  const updateSelectedCountry = useCallback(() => {
    if (countryIndex + 1 < countries.length) {
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
    if (term.toLowerCase() === country.properties.nameEn.toLowerCase()) {
      setShowAnswer('correct');
      setCorrectGuesses((total) => total + 1);
      setStreak((total) => total + 1);
    } else {
      setShowAnswer('incorrect');
      setIncorrectGuesses((total) => total + 1);
      setStreak(0);
    }
  }

  function onStart(difficulty) {
    setShowGameOver(false);
    setCountries(countriesByDifficulty[difficulty]);
    const newRotation = geoCentroid(countriesByDifficulty[difficulty][0]);
    setRotation([-newRotation[0], -newRotation[1]]);
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
          Round: {countryIndex + 1}/{countries.length}
        </div>
        <div>
          <h1>Country Guesser</h1>
          <Timer gameRunning={showAnswer === null && showGameOver === false} />
        </div>
        <div>
          <div>Streak: {streak}</div>
          <div>Correct: {correctGuesses}</div>
          <div>Incorrect: {incorrectGuesses}</div>
        </div>
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
              {country.properties.nameEn}
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
