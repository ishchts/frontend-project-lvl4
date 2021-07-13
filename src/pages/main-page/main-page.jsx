import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import {
  Container,
  Row,
  Col,
  Button,
  InputGroup,
  FormControl,
  Dropdown,
  ButtonGroup,
} from 'react-bootstrap';
import { PlusSquare, ArrowRightSquare } from 'react-bootstrap-icons';
import { io } from 'socket.io-client';
import { getChatData } from '../../store/feature/chat/action.js';
import {
  setCurrentChannel, addMessage, addChannel, renameChannel, removeChannel,
} from '../../store/feature/chat/chat-slice.js';
import { getChat } from '../../store/feature/chat/chat-selectors';
import { getModal, MODAL_NAMES } from '../../components/modals';

import './main-page.scss';

const socket = io();

socket.on('connect', () => {
  console.log(socket.connected); // true
});

const MainPage = () => {
  const dispatch = useDispatch();
  const chat = useSelector(getChat);
  const { data: { channels, currentChannelId, messages } } = chat;
  const [modalInfo, setModalInfo] = useState({ type: null, item: null });
  const ModalComponent = getModal(modalInfo.type ?? MODAL_NAMES.adding);
  const handleCloseModal = () => setModalInfo({ type: null, item: null });
  const handleShowModal = (type, item = null) => () => setModalInfo({ type, item });
  const handleSubmitModal = (values) => {
    if (modalInfo.type === MODAL_NAMES.adding) {
      socket.emit('newChannel', values, (response) => {
        if (response.status !== 'ok') {
          return;
        }
        dispatch(addChannel(response.data));
        dispatch(setCurrentChannel(response.data.id));
      });
    }

    if (modalInfo.type === MODAL_NAMES.renaming) {
      socket.emit('renameChannel', values, (response) => {
        if (response.status !== 'ok') {
          return;
        }
        dispatch(renameChannel(values));
      });
    }

    if (modalInfo.type === MODAL_NAMES.removing) {
      socket.emit('removeChannel', values, (response) => {
        dispatch(removeChannel({ channelId: values.id }));
        console.log('response', response);
      });
    }

    handleCloseModal();
  };

  const handleChangeChannel = (channelId) => (e) => {
    e.preventDefault();
    dispatch(setCurrentChannel(channelId));
  };

  const currentChannel = channels.find((el) => el.id === currentChannelId);
  const currentMessages = messages.filter((el) => el.channelId === currentChannelId);

  const formik = useFormik({
    initialValues: {
      body: '',
    },
    onSubmit: ((values, { resetForm }) => {
      const username = localStorage.getItem('username');
      const newMessage = {
        ...values,
        channelId: currentChannelId,
        username,
      };

      socket.emit('newMessage', newMessage, (response) => {
        if (response.status === 'ok') {
          console.log('newMessage ok');
        }
      });

      resetForm();
    }),
  });

  useEffect(() => {
    dispatch(getChatData());

    socket.on('newMessage', (newMessage) => {
      dispatch(addMessage(newMessage));
    });
  }, []);

  return (
    <>
      <div className="main-page rounded shadow">
        <Container fluid>
          <Row>
            <Col className="main-page__sidebar border-end bg-light pt-5" xs={2}>
              <div className="d-flex justify-content-between align-items-center">
                Каналы
                <Button
                  onClick={handleShowModal(MODAL_NAMES.adding)}
                  className="main-page__add-channel-button"
                  size="sm"
                >
                  <PlusSquare color="#007bff" size="18" />
                </Button>
              </div>
              <ul className="channelList">
                {channels.map((el) => {
                  if (el.removable) {
                    return (
                      <li key={el.id}>
                        <Dropdown className="w-100" as={ButtonGroup}>
                          <Button
                            className="w-100 rounded-0 text-start text-truncate"
                            variant={el.id === currentChannelId ? 'secondary' : null}
                            onClick={handleChangeChannel(el.id)}
                          >
                            {el.name}
                          </Button>

                          <Dropdown.Toggle
                            className="flex-grow-0"
                            split
                            variant={el.id === currentChannelId ? 'secondary' : null}
                          />

                          <Dropdown.Menu>
                            <Dropdown.Item onClick={handleShowModal(MODAL_NAMES.removing, el)}>
                              Удалить
                            </Dropdown.Item>
                            <Dropdown.Item onClick={handleShowModal(MODAL_NAMES.renaming, el)}>
                              Переименовать
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </li>
                    );
                  }

                  return (
                    <li key={el.id}>
                      <Button
                        className="w-100"
                        variant={el.id === currentChannelId ? 'secondary' : null}
                        onClick={handleChangeChannel(el.id)}
                      >
                        #
                        {el.name}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Col>
            <Col className="col p-0 d-flex main-page__content" xs={10}>
              <div className="bg-light mb-4 p-3 shadow-sm small main-page__content-header">
                <p className="m-0">
                  <b>
                    #
                    {currentChannel?.name}
                  </b>
                </p>
                <span className="text-muted">
                  {currentMessages.length}
                  {' '}
                  сообщений
                </span>
              </div>
              <div className="chat-messages overflow-auto px-5 ">
                {currentMessages.map((el) => (
                  <div key={el.id} className="text-break mb-2">
                    <b>{el.username}</b>
                    :
                    {' '}
                    {el.body}
                  </div>
                ))}
              </div>
              <div className="mt-auto px-5 py-3 main-page__content-footer">
                <form className="add-message-form" onSubmit={formik.handleSubmit}>
                  <InputGroup className="mb-3">
                    <FormControl
                      name="body"
                      value={formik.values.body}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Введите сообщение..."
                      aria-label="Recipient's username"
                      aria-describedby="basic-addon2"
                      size="lg"
                      data-testid="new-message"
                    />
                    <InputGroup.Append>
                      <button
                        type="submit"
                        aria-label="add-message"
                        disabled={formik.values.body.length === 0}
                      >
                        <ArrowRightSquare size="20" />
                      </button>
                    </InputGroup.Append>
                  </InputGroup>
                </form>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      <ModalComponent
        modalInfo={modalInfo}
        handleCloseModal={handleCloseModal}
        handleSubmitModal={handleSubmitModal}
      />
    </>
  );
};

export default MainPage;