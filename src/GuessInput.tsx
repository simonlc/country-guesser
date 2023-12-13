import { land } from './App';
import { useMemo, useRef, useState } from 'react';
import { useThrottle } from '@uidotdev/usehooks';
import { matchSorter } from 'match-sorter';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

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
  const [value, setValue] = useState(null);
  // const results = useCountryMatch(term);
  // const handleChange = (event) => setTerm(event.target.value);
  const countries = land.features.map((countryItem) => countryItem.properties);

  function handleSubmit(event) {
    event.preventDefault();
    // const data = new FormData(event.target);
    // console.log(data);
    if (value) {
      onSubmit(value.nameEn);
    }
  }

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <div className="guess-input">
        <AutocompleteHint
          options={countries}
          value={value}
          setValue={setValue}
        />
      </div>
      <button type="submit">Guess</button>
    </form>
  );
}

const filterOptions = (options, { inputValue }) =>
  matchSorter(options, inputValue, {
    keys: [
      (item) =>
        `${item.nameEn.toLowerCase()}, ${item.nameEn}, ${item.name}, ${item.abbr
        }, ${item.nameAlt}, ${item.formalName}`,
      { threshold: matchSorter.rankings.STARTS_WITH, key: 'isocode' },
      { threshold: matchSorter.rankings.STARTS_WITH, key: 'isocode3' },
    ],
  }).slice(0, 5);

function AutocompleteHint({ options, value, setValue }) {
  const hint = useRef('');
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <Autocomplete
      ref={inputRef}
      autoHighlight
      disableClearable
      forcePopupIcon={false}
      noOptionsText="No matches"
      openOnFocus={false}
      value={value}
      open={open}
      onOpen={() => {
        if (inputValue.trim().length > 0) {
          setOpen(true);
        }
      }}
      onClose={() => setOpen(false)}
      onChange={(_event, newValue) => {
        setValue(newValue);
        hint.current = newValue.nameEn;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          if (hint.current) {
            const matchingOption = options.find((option) =>
              option.nameEn
                .toLowerCase()
                .startsWith(hint.current.toLowerCase()),
            );
            setInputValue(matchingOption.nameEn);
            setValue(matchingOption);
            hint.current = matchingOption.nameEn;
            setOpen(false);

            event.preventDefault();
          }
        }
      }}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
        if (newInputValue.trim().length > 0) {
          setOpen(true);
        } else {
          setOpen(false);
        }
      }}
      onBlur={() => {
        hint.current = '';
      }}
      getOptionKey={(country) =>
        country.isocode3 === '-99' ? country.nameEn : country.isocode3
      }
      getOptionLabel={(country) => country.nameEn}
      disablePortal
      inputValue={inputValue}
      filterOptions={filterOptions}
      id="country-guess"
      options={options}
      sx={{ width: 300 }}
      renderInput={(params) => {
        return (
          <Box sx={{ position: 'relative' }}>
            <TextField
              {...params}
              autoFocus
              onChange={(e) => {
                const newValue = e.target.value;
                setInputValue(newValue);
                // options isn't sorted the same as match-sorter
                const matchingOption = options.find((option) =>
                  option.nameEn
                    .toLowerCase()
                    .startsWith(newValue.toLowerCase()),
                );

                if (newValue && matchingOption) {
                  hint.current =
                    newValue + matchingOption.nameEn.slice(newValue.length);
                } else {
                  hint.current = '';
                }
              }}
            // label="Country"
            />
            <Typography
              className="guess-hint"
              sx={{
                width: 292,
                position: 'absolute',
                opacity: 0.5,
                left: 5,
                top: 7,
              }}
            >
              {hint.current}
            </Typography>
          </Box>
        );
      }}
      renderOption={(props, option, { inputValue }) => {
        const matches = match(option.nameEn, inputValue, { insideWords: true });
        const parts = parse(option.nameEn, matches);

        return (
          <li {...props}>
            <div>
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{
                    fontWeight: part.highlight ? 700 : 400,
                  }}
                >
                  {part.text}
                </span>
              ))}
            </div>
          </li>
        );
      }}
    />
  );
}
