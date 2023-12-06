import './App.css';
import { useLayoutEffect, useState, useCallback } from 'react';
import * as topojson from 'topojson-client';
import world from '../countrymasks.json';
import { useWindowSize } from '@uidotdev/usehooks';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { IntroModal } from './IntroModal';
import { Globe } from './Globe';
import { geoCentroid } from 'd3-geo';
import { GuessInput } from './GuessInput';
import { weightedShuffle, weights } from './weights';

export const land = topojson.feature(world, world.objects.countrymasks);
const countriesArray = land.features;

const sortedCountries = weightedShuffle(Object.entries(weights));

const countries = sortedCountries.map(([countryCode]) => {
  return countriesArray.find((item) => item.properties.isocode === countryCode);
});

const initialRotation = geoCentroid(countries[0]);

export default function App() {
  const [countryIndex, setCountryIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState<string | null>(null);
  const [rotation, setRotation] = useState([
    -initialRotation[0],
    -initialRotation[1],
  ]);
  const size = useWindowSize();
  const modal = useModal(IntroModal);
  const country = countries[countryIndex];

  const updateSelectedCountry = useCallback(() => {
    const newIndex = countryIndex + 1;
    setCountryIndex(newIndex);
    const newRotation = geoCentroid(countries[newIndex]);
    setRotation([-newRotation[0], -newRotation[1]]);
  }, [countryIndex]);

  function setNewCountry() {
    setShowAnswer(null);
    updateSelectedCountry();
  }

  function handleSubmit(term: string) {
    if (term.toLowerCase() === country.properties.NAME.toLowerCase()) {
      setShowAnswer('correct');
    } else {
      setShowAnswer('incorrect');
    }
  }

  useLayoutEffect(() => {
    if (!modal.visible) {
      NiceModal.show(IntroModal);
    }
  }, []);

  return (
    <div className="wrapper">
      <Globe
        country={country}
        size={size}
        initialRotation={initialRotation}
        rotation={rotation}
      />
      <div className="overlay">
        {showAnswer ? (
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
