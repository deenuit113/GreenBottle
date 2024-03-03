import * as S from "./Signup.styles";

export default function SignupUI(props) {
    return(
        <S.Wrapper>
            <S.Logo onClick={props.onClickMoveToMainpage}>AlcoholMap</S.Logo>
            <S.Title>회원가입</S.Title>
                <S.InfoWrapper>
                    <S.Label>이메일: </S.Label>
                    <S.InputInfo type = "text" name = "email" value = {props.formData.email} onChange={props.onChangeInput} />
                </S.InfoWrapper>
                <S.ErrorMsgWrapper>{props.emailError}</S.ErrorMsgWrapper>
            
                <S.InfoWrapper>
                    <S.Label>비밀번호: </S.Label>
                    <S.InputInfo type = "password" name = "password" value = {props.formData.password} onChange={props.onChangeInput} />
                </S.InfoWrapper>
                <S.ErrorMsgWrapper>{props.pwError}</S.ErrorMsgWrapper>

                <S.InfoWrapper>
                    <S.Label>닉네임: </S.Label>
                    <S.InputInfo type = "text" name = "nickname" value = {props.formData.nickname} onChange={props.onChangeInput}/>
                </S.InfoWrapper>
                <S.ErrorMsgWrapper>{props.nnError}</S.ErrorMsgWrapper>

                <S.InfoWrapper>
                    <S.Label>주량: </S.Label>
                    <S.InputInfo type = "number" name = "capaSoju" value = {props.formData.capaSoju} onChange={props.onChangeInput}/>
                </S.InfoWrapper>
                <S.ErrorMsgWrapper>{props.capaError}</S.ErrorMsgWrapper>
                <S.ButtonWrapper><S.SignUpButton onClick={props.onClickSubmit}>회원가입</S.SignUpButton></S.ButtonWrapper>
                

        </S.Wrapper>
    )
}