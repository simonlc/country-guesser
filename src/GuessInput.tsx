import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';
import '@reach/combobox/styles.css';
import { land } from './App';
import { useMemo, useState } from 'react';
import { useThrottle } from '@uidotdev/usehooks';
import { matchSorter } from 'match-sorter';

function useCountryMatch(term: string) {
  const throttledTerm = useThrottle(term, 100);
  const countries = useMemo(
    () => land.features.map((countryItem) => countryItem.properties),
    [],
  );
  return useMemo(
    () =>
      term.trim() === ''
        ? null
        : matchSorter(countries, term, {
          keys: [
            (item) =>
              `${item.name}, ${item.nameEn}, ${item.abbr}, ${item.isocode3}, ${item.isocode}, ${item.nameAlt}, ${item.formalName}`,
          ],
        }),
    [throttledTerm],
  );
}

export function GuessInput({ onSubmit }) {
  const [term, setTerm] = useState('');
  const results = useCountryMatch(term);
  const handleChange = (event) => setTerm(event.target.value);
  return (
    <form
      className="guess-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(term);
      }}
    >
      <div className="guess-input">
        <Combobox aria-label="Countries" onSelect={setTerm}>
          <ComboboxInput autoFocus onChange={handleChange} />
          {results && (
            <ComboboxPopover className="shadow-popup">
              {results.length > 0 ? (
                <ComboboxList>
                  {results.slice(0, 10).map((result, index) => (
                    <ComboboxOption
                      key={result.isocode3}
                      value={result.nameEn}
                    />
                  ))}
                </ComboboxList>
              ) : (
                <span style={{ display: 'block', margin: 8 }}>
                  No results found
                </span>
              )}
            </ComboboxPopover>
          )}
        </Combobox>
      </div>
      <button type="submit">Guess</button>
    </form>
  );
}
