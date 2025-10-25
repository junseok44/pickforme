import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSetAtom, useAtomValue } from 'jotai';
import { getRequestAtom, postAnswerAtom, requestsAtom, deleteRequestAtom } from '@/stores/request/atoms';
import { Request, RequestStatus, RequestType, Product } from '@/stores/request/types';
import styled from '@emotion/styled';

const RequestTypeName = {
  [RequestType.RECOMMEND]: '픽포미 추천',
  [RequestType.RESEARCH]: '픽포미 분석',
  [RequestType.QUESTION]: '픽포미 질문'
};

export default function RequestScreen() {
  const router = useRouter();
  const getRequest = useSetAtom(getRequestAtom);
  const postAnswer = useSetAtom(postAnswerAtom);
  const deleteRequest = useSetAtom(deleteRequestAtom);
  const requests = useAtomValue(requestsAtom);
  const [tempAnswer, setTempAnswer] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState<boolean[]>([]);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [initialAnswer, setInitialAnswer] = useState('');
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const requestId = router.query.requestId as string;
  const request = requests.find(req => req._id === requestId);

  useEffect(() => {
    if (requestId) {
      getRequest({ requestId });
    }
  }, [requestId, getRequest]);

  useEffect(() => {
    if (request?.answer?.products) {
      setProducts(request.answer.products);
      setInitialProducts(request.answer.products);
      setIsEditing(new Array(request.answer.products.length).fill(false));
    }
    if (request?.answer?.text) {
      setTempAnswer(request.answer.text);
      setInitialAnswer(request.answer.text);
    }
  }, [request]);

  if (!request) return <div>Loading...</div>;

  const handleAnswerSubmit = () => {
    if (!window.confirm('정말 답변을 전송하시겠습니까?')) return;
    postAnswer({
      requestId: request._id,
      answer: {
        text: tempAnswer,
        products
      }
    });
    setIsEditingAnswer(false);
    setInitialAnswer(tempAnswer);
    setInitialProducts(products);
    window.alert('답변 전송이 완료되었습니다!');
  };

  const handleProductChange = (index: number, field: keyof Product, value: string | string[] | number) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, { title: '', desc: '', url: '', price: 0, tags: [] }]);
    setIsEditing([...isEditing, true]);
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
    const newIsEditing = isEditing.filter((_, i) => i !== index);
    setIsEditing(newIsEditing);
  };

  const toggleEditing = (index: number) => {
    const newIsEditing = [...isEditing];
    newIsEditing[index] = !newIsEditing[index];
    setIsEditing(newIsEditing);
  };

  const toggleEditingAnswer = () => {
    setIsEditingAnswer(!isEditingAnswer);
  };

  const isChanged = () => {
    return (
      tempAnswer !== initialAnswer ||
      JSON.stringify(products) !== JSON.stringify(initialProducts)
    );
  };

  const deleteRequestHandler = async () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await deleteRequest(request._id);
      router.push('/'); // 삭제 후 홈으로 이동
    }
  }

  return (
    <Container>
      <Title>{request.name}</Title>
      <Status status={request.status}>{request.status}</Status>
      <Type>{RequestTypeName[request.type]}</Type>
      <UserData>{request.userId?.email}</UserData>
      <CreatedAt>{new Date(request.createdAt).toLocaleString()}</CreatedAt>
      <Seperator/>
      <SectionTitle>의뢰 내용</SectionTitle>
      <RequestText>{request.text}</RequestText>
      {request.type === RequestType.QUESTION && (
        <>
          <SectionTitle>상품 정보</SectionTitle>
          <div>상품명 | {request.product.name}</div>
          <div>가격 | {request.product.price}원</div>
          <div><a href={request.product.url} target="_blank" rel="noopener noreferrer">{request.product.url}</a></div>
        </>
      )}
      {request.type === RequestType.RECOMMEND && (
        <>
          <SectionTitle>희망 가격대</SectionTitle>
          <div>{request.price}</div>
        </>
      )}
      {request.type === RequestType.RESEARCH && (
        <>
          <SectionTitle>상품 링크</SectionTitle>
          <div><a href={request.link} target="_blank" rel="noopener noreferrer">{request.link}</a></div>
        </>
      )}
      {request.review && (
        <>
          <Seperator />
          <SectionTitle>사용자 리뷰</SectionTitle>
          <div>{request.review.text}</div>
          <div>{request.review.rating}점</div>
        </>
      )}
      <Seperator />
      <AnswerForm onSubmit={e => { e.preventDefault(); handleAnswerSubmit(); }}>
        <SectionTitle>답변 내용</SectionTitle>
        {isEditingAnswer ? (
          <>
            <AnswerInput
              value={tempAnswer}
              onChange={e => setTempAnswer(e.target.value)}
              placeholder="Write your answer here..."
            />
            <SaveButton type="button" onClick={toggleEditingAnswer}>Save</SaveButton>
          </>
        ) : (
          <>
            <AnswerText>{tempAnswer}</AnswerText>
            <EditButton type="button" onClick={toggleEditingAnswer}>Edit</EditButton>
          </>
        )}
        <SectionTitle>상품 정보 입력</SectionTitle>
        {products.map((product, index) => (
          <ProductForm key={index}>
            {isEditing[index] ? (
              <>
                <Input
                  value={product.title}
                  onChange={e => handleProductChange(index, 'title', e.target.value)}
                  placeholder="Product Title"
                />
                <Input
                  value={product.desc}
                  onChange={e => handleProductChange(index, 'desc', e.target.value)}
                  placeholder="Product Description"
                />
                <Input
                  value={product.url}
                  onChange={e => handleProductChange(index, 'url', e.target.value)}
                  placeholder="Product URL"
                />
                <Input
                  type="number"
                  value={product.price}
                  onChange={e => handleProductChange(index, 'price', parseFloat(e.target.value))}
                  placeholder="Product Price"
                />
                <Input
                  value={product.tags.join(', ')}
                  onChange={e => handleProductChange(index, 'tags', e.target.value.split(',').map(tag => tag.trim()))}
                  placeholder="Product Tags (comma separated)"
                />
                <SaveButton type="button" onClick={() => toggleEditing(index)}>Save</SaveButton>
                <RemoveButton type="button" onClick={() => removeProduct(index)}>Remove Product</RemoveButton>
              </>
            ) : (
              <>
                <ProductTitle>{product.title}</ProductTitle>
                <ProductDesc>{product.desc}</ProductDesc>
                <ProductPrice>{product.price}</ProductPrice>
                <ProductTags>{product.tags.join(', ')}</ProductTags>
                <a href={product.url} target="_blank" rel="noopener noreferrer">View Product</a>
                <EditButton type="button" onClick={() => toggleEditing(index)}>Edit</EditButton>
              </>
            )}
          </ProductForm>
        ))}
        <AddButton type="button" onClick={addProduct}>상품 추가</AddButton>
        <ButtonGroup>
          <SubmitButton type="submit" disabled={!isChanged()}>답변 전송</SubmitButton>
          <RemoveButton type="button" onClick={deleteRequestHandler}>삭제</RemoveButton>
        </ButtonGroup>
      </AnswerForm>
    </Container>
  );
}

const Container = styled.div`
  width: 1200px;
  padding: 20px;
  margin: 0 auto;
  background-color: #f9f9f9;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const Status = styled.span<{ status: RequestStatus }>`
  display: inline-block;
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 5px;
  color: white;
  background-color: ${({ status }) =>
    status === RequestStatus.PENDING ? 'orange' :
    status === RequestStatus.SUCCESS ? 'green' :
    'red'};
`;

const Type = styled.div`
  font-size: 18px;
  color: #555;
  margin-bottom: 10px;
`;

const UserData = styled.div`
  font-size: 16px;
  margin-bottom: 10px;
`;

const CreatedAt = styled.div`
  color: grey;
  margin-bottom: 20px;
`;

const Seperator = styled.div`
  width: 100%;
  height: 1px;
  background-color: #ddd;
  margin: 20px 0;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  margin-bottom: 10px;
  color: #333;
`;

const RequestText = styled.p`
  font-size: 18px;
  margin-bottom: 20px;
`;

const AnswerText = styled.p`
  font-size: 16px;
  margin-bottom: 10px;
`;

const AnswerForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const AnswerInput = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
`;

const ProductForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  background-color: #fff;
`;

const ProductTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 5px;
`;

const ProductDesc = styled.p`
  font-size: 14px;
  margin-bottom: 5px;
`;

const ProductPrice = styled.p`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const ProductTags = styled.p`
  font-size: 12px;
  color: grey;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const AddButton = styled.button`
  padding: 10px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #555;
  }
`;

const EditButton = styled.button`
  padding: 10px;
  background-color: #2196f3;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #1976d2;
  }
`;

const SaveButton = styled.button`
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
`;

const RemoveButton = styled.button`
  padding: 10px;
  background-color: #d9534f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #c9302c;
  }
`;

const SubmitButton = styled.button<{ disabled: boolean }>`
  padding: 10px;
  background-color: ${({ disabled }) => (disabled ? '#888' : '#333')};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#888' : '#555')};
  }
`;
