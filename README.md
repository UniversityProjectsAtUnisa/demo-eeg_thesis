# EEG seizure prediction demo

Demo desktop application that shows how the developed system predicts epileptic seizures on EEG.

## Description

The application is divided into 3 pages:

- Home page: load EEG recording file
- Demostrator page: shows the practical behavior of the detection system
- Event navigation page: select and navigate EEG segments with incoming seizure patterns

The application uses web technologies through Electron. The technologies are:

- React
- Typescript
- CSS

The project uses the following libraries:

- **Mantine**: React UI components library
- **visx**: collection of expressive, low-level SVG visualization primitives for React
- **react-router-dom**: page routing labrary
- **zustand**: simple state-management library

## Dependencies

- **Node.js**
- **yarn**

## Installing

```
yarn
```

## Executing development app

```
yarn start
```

## Building platform installer

```
yarn make
```

## Building portable

```
yarn package
```

## Executing web development

```
yarn webstart
```

## Build html/css/js/assets for web deployment

```
yarn webbuild
```
