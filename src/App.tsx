import './App.css'
import { useLayoutEffect, useEffect, useState, useRef, useCallback } from 'react'
import * as topojson from "topojson-client"
import world from '../countrymasks.json';
import { useWindowSize } from "@uidotdev/usehooks";
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { IntroModal } from './IntroModal'
import { Globe } from './Globe';
import { geoCentroid } from 'd3-geo';


export const land = topojson.feature(world, world.objects.countrymasks)
const countries = land.features;

function randomizeCountry() {
  return countries[Math.floor(Math.random() * countries.length)]
}

const initialCountry = randomizeCountry()
const initialRotation = geoCentroid(initialCountry);

export default function App() {
  const [country, setCountry] = useState(initialCountry)
  const [showAnswer, setShowAnswer] = useState(false)
  const [rotation, setRotation] = useState([-initialRotation[0], -initialRotation[1]]);
  const size = useWindowSize();
  const modal = useModal(IntroModal)

  const nameMatches = false;

  const updateSelectedCountry = useCallback(newCountry => {
    console.log('newCountry', newCountry);
    setCountry(newCountry);
    const newRotation = geoCentroid(newCountry)
    setRotation([-newRotation[0], -newRotation[1]]);
    // const center = geoCentroid(country);
  }, []);

  const handleCountryClick = ({ target: { id } }) => {
    updateSelectedCountry(getCountryById(id));
  };

  function newCountry(difficulty) {
    setShowAnswer(false);
    // setCountry(randomizeCountry);
    updateSelectedCountry(randomizeCountry())
  }

  function handleSubmit(event) {
    event.preventDefault();
    setShowAnswer(true);
  }

  useLayoutEffect(() => {
    if (!modal.visible) {
      NiceModal.show(IntroModal)
    }
  }, []);

  return (
    <div className="wrapper">
      <Globe country={country} size={size} initialRotation={initialRotation} rotation={rotation} onCountryClick={handleCountryClick} />
      <div className="overlay">
        {showAnswer ?
          <>
            {nameMatches ? <div className="font-effect-outline correct">Correct!</div> : <div className="font-effect-outline incorrect">Incorrect.</div>}
            <div className="country-name font-effect-outline">{country.properties.NAME}</div>
            <button autoFocus type="button" onClick={newCountry}>Next</button>
          </>
          : <form className="guess-form" onSubmit={handleSubmit}>
            <input autoFocus className="guess-input" type="text" />
            <button type="submit">Guess</button>
          </form>
        }
      </div>
    </div>
  )
}
