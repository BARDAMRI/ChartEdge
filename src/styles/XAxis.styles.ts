import styled from 'styled-components';

interface StyledXAxisCanvasProps {
  $height: number;
}

export const StyledXAxisCanvas = styled.canvas<StyledXAxisCanvasProps>`
  display: block;
  position: relative;
  width: 100%;
  height: ${({ $height }) => `${$height}px`};
  padding: 0;
  margin: 0;
  background-color: white;
  border: none;
  pointer-events: none;
`;