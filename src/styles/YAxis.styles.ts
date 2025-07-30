import styled from 'styled-components';

interface StyledYAxisCanvasProps {
  $position: 'left' | 'right';
}

export const StyledYAxisCanvas = styled.canvas<StyledYAxisCanvasProps>`
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: none;
  pointer-events: none;
  left: ${({ $position }) => ($position === 'left' ? '0' : 'auto')};
  right: ${({ $position }) => ($position === 'right' ? '0' : 'auto')};
  top: 0;
  bottom: 0;
`;