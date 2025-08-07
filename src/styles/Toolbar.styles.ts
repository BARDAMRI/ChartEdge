import styled from 'styled-components';

export const ToolbarContainer = styled.div`
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    width: 40px;
    background-color: #ddd;
    height: 100%;
`;

export const ToolbarContent = styled.div`
    width: 40px;
    height: 100%;
    display: grid;
    grid-column: 1;
    grid-auto-flow: row;
    grid-template-rows: repeat(auto-fill, minmax(40px, 1fr));
    grid-template-columns: 1fr;
    align-content: start;
    justify-content: center;
    overflow: hidden; 
`;

interface ToolbarButtonProps {
    $selected?: boolean;
}

export const ToolbarButton = styled.button<ToolbarButtonProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    width: 100%;
    padding: 0;
    margin: 0;
    overflow: hidden;
    text-align: center;
    font-size: 18px;
    flex-grow: 1;
    background-color: ${({$selected}) => ($selected ? '#333' : 'transparent')};
    color: ${({$selected}) => ($selected ? '#fff' : '#000')};
    border-left: ${({$selected}) => ($selected ? '3px solid #007bff' : 'none')};
    cursor: pointer;

    &:hover {
        background-color: #ccc;
    }
`;