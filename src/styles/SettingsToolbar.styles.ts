import styled from 'styled-components';

export const SettingsToolbarContainer = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 12px;
    padding: 6px 12px;
    height: 28px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dcdcdc;

    input[type="text"],
    select {
        padding: 4px 8px;
        font-size: 13px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: white;
        color: #333;

        &:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 1px #007bff44;
        }
    }

    button {
        font-size: 13px;
        padding: 4px 10px;
        border: 1px solid #007bff;
        background-color: white;
        color: #007bff;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
            background-color: #007bff;
            color: white;
        }
    }
`;