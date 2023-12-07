import { land } from './App';
import { useMemo, useState } from 'react';
import { useThrottle } from '@uidotdev/usehooks';
import { Typeahead } from 'react-bootstrap-typeahead';
// import 'react-bootstrap-typeahead/css/Typeahead.css';
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
        : matchSorter<(typeof land.features.properties)[0]>(countries, term, {
          keys: [
            (item) =>
              `${item.name}, ${item.nameEn}, ${item.abbr}, ${item.isocode3}, ${item.isocode}, ${item.nameAlt}, ${item.formalName}`,
          ],
        }),
    [throttledTerm],
  );
}

export function GuessInput({ onSubmit }) {
  // const [term, setTerm] = useState('');
  const [singleSelections, setSingleSelections] = useState<any[]>([]);
  // const results = useCountryMatch(term);
  // const handleChange = (event) => setTerm(event.target.value);
  const countries = land.features.map((countryItem) => countryItem.properties);
  console.log(singleSelections);
  return (
    <form
      className="guess-form"
      onSubmit={(event) => {
        event.preventDefault();
        // const data = new FormData(event.target);
        // console.log(data);
        if (singleSelections.length === 1) {
          onSubmit(singleSelections[0].nameEn);
        }
      }}
    >
      <div className="guess-input">
        <Typeahead
          id="basic-typeahead-single"
          labelKey="nameEn"
          autoFocus
          minLength={1}
          onChange={setSingleSelections}
          options={countries}
          placeholder="Search country..."
          caseSensitive={false}
          ignoreDiacritics={true}
          selected={singleSelections}
        />
      </div>
      <button type="submit">Guess</button>
    </form>
  );
}
