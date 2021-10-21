# Infinite React Slider - Pavelcorp

An infinite slider built with React

## Example
```javascript
import React from 'react';
import Slider from '@pavelcorp/infinite-react-slider';

const Component = () => {
  return (
    <Slider totalTime={2000} fps={60}>
      <div>Infinite</div>
      <div>React</div>
      <div>Slider</div>
    </Slider>
  )
}
```

## Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| totalTime | Number | 5000 | Total time loop time in ms |
| fps | Number | 60 | Animation frame rate |
| offset | Number | 0 | Animation stops when slider if above viewport |

